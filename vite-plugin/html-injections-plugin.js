// Joorchin HTML-injections plugin (vendored, base44-free).
//
// Two plugins, because they have different lifetimes:
//   - Preview-only helpers (error overlay, iframe notifiers, HMR) stay off
//     `vite build`. A published site must not ship Studio-iframe plumbing.
//   - Runtime telemetry is injected in EVERY mode. The admin panel's Runtime
//     tab reads ClickHouse `events` domain `app_runtime`, which is filled only
//     when this script beacons `POST /api/v1/apps/:id/telemetry`. Gating it on
//     `mode !== production` left published (and any `vite build`) sites mute.
//
// Scripts are served from the Vite public root (committed under public/), so
// the paths are plain base-relative URLs — no node_modules path rewriting.

function withTrailingSlash(base) {
  const raw = base || "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export function scriptSrc(base, file) {
  return `${withTrailingSlash(base)}${file}`;
}

/**
 * Tags that must ship in preview AND published HTML.
 * `appId` is inlined so custom domains (no `/app/<id>/` in the path) still
 * know which app to beacon. `runtime-telemetry.js` is a classic script, not
 * `type=module`, so `window.__joorchinTelemetry` exists before the app module
 * runs (App.jsx reports through that global).
 */
export function runtimeTelemetryTags({ base, appId }) {
  const tags = [];
  if (appId) {
    tags.push({
      tag: "script",
      children: `window.__JOORCHIN_APP_ID=${JSON.stringify(appId)};`,
      injectTo: "head",
    });
  }
  tags.push({
    tag: "script",
    attrs: { src: scriptSrc(base, "runtime-telemetry.js") },
    injectTo: "head",
  });
  return tags;
}

/** Studio-iframe / Vite-dev helpers. Never in a published build. */
export function previewOnlyInjectionTags({ base, hmrNotifier }) {
  const src = (file) => scriptSrc(base, file);
  return [
    {
      tag: "script",
      attrs: { src: src("unhandled-errors-handlers.js"), type: "module" },
      injectTo: "head",
    },
    {
      tag: "script",
      attrs: { src: src("preview-error-observer.js"), type: "module" },
      injectTo: "head",
    },
    {
      tag: "script",
      attrs: { src: src("preview-route-notifier.js"), type: "module" },
      injectTo: "head",
    },
    {
      tag: "script",
      attrs: { src: src("sandbox-mount-observer.js"), type: "module" },
      injectTo: "body",
    },
    ...(hmrNotifier
      ? [
          {
            tag: "script",
            attrs: { src: src("sandbox-hmr-notifier.js"), type: "module" },
            injectTo: "head",
          },
        ]
      : []),
  ];
}

export function htmlInjectionsPlugin({ hmrNotifier } = {}) {
  let base = "/";
  let appId = "";

  return [
    {
      name: "html-injections-preview",
      apply: (config) => config.mode !== "production",
      transformIndexHtml: {
        handler() {
          return previewOnlyInjectionTags({ base, hmrNotifier });
        },
      },
    },
    {
      name: "runtime-telemetry-injection",
      configResolved(config) {
        base = withTrailingSlash(config.base);
        appId =
          config.env?.VITE_APP_ID ||
          process.env.VITE_APP_ID ||
          process.env.MODAL_SANDBOX_ID ||
          "";
      },
      transformIndexHtml: {
        handler() {
          return runtimeTelemetryTags({ base, appId });
        },
      },
    },
  ];
}
