/**
 * Joorchin runtime telemetry beacon (preview AND published).
 *
 * Captures how the *generated app* actually behaves at run-time — uncaught
 * errors, unhandled rejections, console.error, failed Joorchin API calls, and
 * blank-render (white screen) — and beacons them to be-core, which persists
 * them to `.app-runtime/<appId>.jsonl` (local) and ClickHouse `events` domain
 * `app_runtime` (the admin Runtime tab).
 *
 * Injected in every mode by vite-plugin/html-injections-plugin.js. Pairs with
 * the existing postMessage-to-parent reporters (unhandled-errors-handlers.js,
 * preview-error-observer.js) — this one adds durable server-side persistence.
 *
 * APP_ID is baked as `window.__JOORCHIN_APP_ID` at HTML inject time so a
 * published site on `{slug}.domain` (no `/app/<id>/` in the path) still
 * knows which app to report. Path parsing remains a fallback for older HTML.
 */
(function () {
  if (window.__joorchinTelemetryInit) return;
  window.__joorchinTelemetryInit = true;

  // ---- resolve appId -------------------------------------------------------
  // Prefer the baked id (published custom domains have no app id in the URL).
  // Container previews are served under `/app/<appId>/`; last resort is the
  // first 24-char hex id found in the path.
  function resolveAppId() {
    const baked = window.__JOORCHIN_APP_ID;
    if (typeof baked === "string" && baked) return baked;
    const path = window.location.pathname || "";
    const appMatch = path.match(/\/app\/([A-Za-z0-9_-]+)/);
    if (appMatch && appMatch[1]) return appMatch[1];
    const hex = path.match(/[a-f0-9]{24}/);
    return hex ? hex[0] : null;
  }

  const APP_ID = resolveAppId();
  if (!APP_ID) {
    // No app context (e.g. local `pnpm dev` at `/`) — nothing to scope to.
    return;
  }

  const ENDPOINT = `/api/v1/apps/${APP_ID}/telemetry`;
  const MAX_QUEUE = 20;
  const FLUSH_MS = 2000;
  const DETAILS_MAX = 4000;
  const SID_KEY = "joorchin_sid";
  const PREVIEW_TOKEN_KEY = `joorchin_preview_token:${APP_ID}`; // same key as src/api/auth.js

  let queue = [];
  let flushTimer = null;
  const seen = new Set(); // dedupe identical messages within a session

  // ---- visit identity -----------------------------------------------------
  // One id per tab session, in sessionStorage so it dies with the tab. It is
  // NOT a visitor id: nothing here survives a tab close, so the beacon cannot
  // be used to follow a person across visits.
  function sessionId() {
    try {
      let sid = sessionStorage.getItem(SID_KEY);
      if (!sid) {
        const bytes = new Uint8Array(8);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        sid = Array.prototype.map
          .call(bytes, function (b) {
            return ("0" + b.toString(16)).slice(-2);
          })
          .join("");
        sessionStorage.setItem(SID_KEY, sid);
      }
      return sid;
    } catch (_) {
      return null; // private mode / storage blocked — the visit still counts
    }
  }

  // A demo visit is the owner (or the agent) looking at their own site through
  // Studio: a server-minted `tokenKind: 'preview'` JWT is in sessionStorage, or
  // we are inside the Studio preview iframe. Those orders and visits are real
  // production rows, so they are FLAGGED, not hidden — be-core excludes them
  // from the owner's numbers. Self-flagging only ever under-counts.
  function isDemoVisit() {
    // The URL param is checked too: `src/api/auth.js` strips `?preview_token=`
    // from the address bar, and the first pageview can fire before it does.
    if (window.location.search.indexOf("preview_token=") !== -1) return true;
    try {
      if (sessionStorage.getItem(PREVIEW_TOKEN_KEY)) return true;
    } catch (_) {
      /* storage blocked — fall through to the frame check */
    }
    try {
      if (window.self !== window.top) return true;
    } catch (_) {
      return true; // cross-origin frame: we are embedded, so treat as preview
    }
    return false;
  }

  // Module namespaces and null-prototype records cannot be coerced with String.
  // Reporting such a value must not replace the original React/provider error.
  function diagnosticText(value) {
    try {
      return String(value instanceof Error ? value.message : value);
    } catch (_) {
      try {
        return JSON.stringify(value) || "[unprintable value]";
      } catch (_) {
        return "[unprintable value]";
      }
    }
  }

  function trim(value, max) {
    if (value == null) return undefined;
    const str = diagnosticText(value);
    return str.length > max ? str.slice(0, max) : str;
  }

  function enqueue(event, options) {
    // Faults dedupe by `type:message` so one repeating error cannot fill the
    // queue. Pageviews must NOT: revisiting a path in the same session is a
    // second visit, and suppressing it silently under-counts traffic.
    if (!(options && options.allowRepeat)) {
      const sig = `${event.type}:${event.message}${event.type === "api_error" ? `:${event.source}:${event.details || ""}` : ""}`;
      if (seen.has(sig)) return;
      seen.add(sig);
    }

    queue.push({
      type: event.type,
      message: trim(event.message, 500) || "(no message)",
      url: trim(window.location.href, 500),
      details: trim(event.details, DETAILS_MAX),
      source: trim(event.source, 500),
      status: typeof event.status === "number" ? event.status : undefined,
      meta: event.meta,
    });
    if (queue.length >= MAX_QUEUE) {
      flush();
    } else if (!flushTimer) {
      flushTimer = setTimeout(flush, FLUSH_MS);
    }
  }

  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!queue.length) return;
    const batch = queue.splice(0, MAX_QUEUE);
    const payload = JSON.stringify({ events: batch });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          ENDPOINT,
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (_) {
      /* telemetry must never throw into the app */
    }
  }

  // ---- app-facing reporter -------------------------------------------------
  // Platform-owned app code (src/App.jsx's unmatched-route surface) reports
  // through this instead of duplicating the queue/beacon logic. Guarded at the
  // call site with `?.` so a missing inject is a silent no-op, never a throw.
  window.__joorchinTelemetry = {
    report: function (event) {
      try {
        if (!event || !event.type) return;
        enqueue(event);
        flush();
      } catch (_) {
        /* telemetry must never throw into the app */
      }
    },
  };

  // ---- capture sources -----------------------------------------------------
  /*
   * Browser extensions (wallets, ad blockers, password managers) run injected
   * scripts in this page's context. A rejection or error escaping one of them
   * lands on `window` exactly like an app bug, but the generated app neither
   * caused it nor can fix it — and the agent's run-time gate treats every
   * unhandled rejection as blocking, so one visitor with MetaMask installed
   * can burn a whole build budget on "Failed to connect to MetaMask".
   * Anything whose stack or script URL is an extension origin is never
   * reported.
   */
  var EXTENSION_ORIGIN =
    /(?:chrome|moz|safari|edge|chrome-untrusted)-extension:\/\//i;
  function isExtensionOrigin(err, filename) {
    // Every read is guarded: `err` can be a null-prototype object or a Proxy,
    // and this runs inside the app's own error handler — it must never throw a
    // second exception on top of the one it is classifying.
    try {
      if (filename && EXTENSION_ORIGIN.test(String(filename))) return true;
      if (!err || typeof err !== "object") {
        return err ? EXTENSION_ORIGIN.test(diagnosticText(err)) : false;
      }
      if (typeof err.stack === "string" && EXTENSION_ORIGIN.test(err.stack)) {
        return true;
      }
      return EXTENSION_ORIGIN.test(diagnosticText(err.message || err));
    } catch (_) {
      return false;
    }
  }

  window.addEventListener("error", function (event) {
    // Resource load errors (img/script) have no `error` object.
    const err = event.error;
    if (isExtensionOrigin(err, event.filename)) return;
    enqueue({
      type: "window_error",
      message: diagnosticText(
        err ? err.message || err : event.message || "error",
      ),
      details: err && err.stack ? String(err.stack) : undefined,
    });
  });

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    if (isExtensionOrigin(reason)) return;
    enqueue({
      type: "unhandled_rejection",
      message: reason
        ? diagnosticText(reason.message || reason)
        : "unhandled rejection",
      details: reason && reason.stack ? String(reason.stack) : undefined,
    });
  });

  // Wrap console.error (preserve original behaviour).
  const origConsoleError = console.error.bind(console);
  console.error = function (...args) {
    try {
      if (args.some((a) => isExtensionOrigin(a))) {
        return origConsoleError(...args);
      }
      enqueue({
        type: "console_error",
        message: args.map(diagnosticText).join(" "),
        details: args
          .map((a) => (a instanceof Error && a.stack ? a.stack : ""))
          .filter(Boolean)
          .join("\n"),
      });
    } catch (_) {}
    // Keep inspectable objects and Error stacks for normal consoles, but do not
    // pass an uncoercible namespace to an embedding console that calls String.
    const printable = args.map((value) => {
      try {
        String(value);
        return value;
      } catch (_) {
        return diagnosticText(value);
      }
    });
    try {
      return origConsoleError(...printable);
    } catch (_) {
      // The original diagnostic was queued above. A broken console hook must
      // never throw a second error into the app while React reports the first.
    }
  };

  // Read a bounded clone: the app keeps its original response and is never delayed.
  let pendingApiDiagnostics = 0;
  async function reportApiFailure(res, url, method) {
    const event = {
      type: "api_error",
      message: `API ${res.status} ${res.statusText || ""}`.trim(),
      source: url,
      status: res.status,
      details: `method: ${method}`,
    };
    let reader;
    let timer;
    if (pendingApiDiagnostics >= MAX_QUEUE) return enqueue(event);
    pendingApiDiagnostics++;
    try {
      if (Number(res.headers.get("content-length")) > 16384)
        return enqueue(event);
      reader = res.clone().body?.getReader();
      if (!reader) return enqueue(event);
      const read = async function () {
        const decoder = new TextDecoder();
        let text = "";
        let size = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) return text + decoder.decode();
          size += chunk.value.byteLength;
          if (size > 16384) return "";
          text += decoder.decode(chunk.value, { stream: true });
        }
      };
      const text = await Promise.race([
        read(),
        new Promise((resolve) => {
          timer = setTimeout(() => resolve(""), 1000);
        }),
      ]);
      if (text) {
        const payload = JSON.parse(text);
        const error =
          payload?.error && typeof payload.error === "object"
            ? payload.error
            : payload;
        const message =
          error?.message ??
          (typeof payload?.error === "string" ? payload.error : undefined);
        if (typeof message === "string") {
          event.message = `API ${res.status}: ${message}`;
          event.details = JSON.stringify(
            {
              method,
              code: error.code,
              message,
              requestId: error.requestId,
              details: error.details ?? payload.issues,
            },
            (key, value) =>
              /password|secret|token|cookie|authorization|credential|api.?key/i.test(
                key,
              )
                ? "[redacted]"
                : value,
          );
        }
      }
    } catch (_) {
      // HTML, malformed JSON and unreadable bodies retain the HTTP diagnostic.
    } finally {
      pendingApiDiagnostics--;
      if (timer) clearTimeout(timer);
      if (reader) void reader.cancel().catch(function () {});
    }
    enqueue(event);
  }

  // Wrap fetch to record failed Joorchin API calls (non-2xx / network error).
  const origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : input && input.url;
      const isApi =
        typeof url === "string" && url.indexOf("/api/v1/apps/") !== -1;
      return origFetch(input, init).then(
        function (res) {
          if (isApi && !res.ok && url.indexOf("/telemetry") === -1) {
            void reportApiFailure(
              res,
              url,
              init?.method || input?.method || "GET",
            );
          }
          return res;
        },
        function (err) {
          if (isApi && url.indexOf("/telemetry") === -1) {
            enqueue({
              type: "api_error",
              message: `API network error: ${diagnosticText(err && err.message ? err.message : err)}`,
              source: url,
            });
          }
          throw err;
        },
      );
    };
  }

  // Blank-render detector: if #root is still empty a few seconds after load,
  // the app mounted to a white screen (a common silent failure mode).
  window.addEventListener("load", function () {
    setTimeout(function () {
      const root = document.getElementById("root");
      if (root && root.childElementCount === 0) {
        enqueue({
          type: "render_blank",
          message: "#root is empty after load — blank/white screen",
        });
        flush();
      }
    }, 4000);
  });

  /*
   * Rendered-error-text detector: the app caught its own failure and printed
   * the engine's message into the page.
   *
   * Every other capture source above is blind to this. A component that does
   * `.catch((err) => setError(err.message))` — the standard React data-fetch
   * shape — produces no window error, no unhandled rejection, no console.error
   * and, when the throw happens client-side before `fetch` is reached, not even
   * a failed request. App `6aadbb9e89eef57f2770a8ee` (2026-09-19) rendered
   * "params.tags.join is not a function" inside its bestsellers section and
   * every signal here stayed silent.
   *
   * The signatures are engine-generated English that no storefront writes on
   * purpose, in any language. Keep in sync with
   * `RENDERED_ERROR_TEXT_SIGNATURES` in `sdks/contracts/schemas/screenshot.ts`, which the
   * screenshot sidecar runs against the same DOM at build time.
   */
  const RENDERED_ERROR_SIGNATURES = [
    "is not a function",
    "is not defined",
    "is not iterable",
    "Cannot read propert",
    "Cannot access before initialization",
    "undefined is not an object",
    "null is not an object",
    "TypeError:",
    "ReferenceError:",
    "SyntaxError:",
    "RangeError:",
    "[object Object]",
    "Unexpected token",
    "Failed to fetch",
    "NetworkError when attempting",
  ];
  const ERROR_TEXT_SKIP_TAGS = {
    SCRIPT: 1,
    STYLE: 1,
    NOSCRIPT: 1,
    TEMPLATE: 1,
    TITLE: 1,
  };

  function scanRenderedErrorText() {
    try {
      const root = document.body;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let scanned = 0;
      while (node && scanned < 4000) {
        scanned += 1;
        const parent = node.parentElement;
        const text = (node.textContent || "").trim();
        node = walker.nextNode();
        if (!parent || !text || ERROR_TEXT_SKIP_TAGS[parent.tagName]) continue;
        let hit = null;
        for (let i = 0; i < RENDERED_ERROR_SIGNATURES.length; i += 1) {
          if (text.indexOf(RENDERED_ERROR_SIGNATURES[i]) !== -1) {
            hit = RENDERED_ERROR_SIGNATURES[i];
            break;
          }
        }
        if (!hit) continue;
        // Extension-injected UI lives in the same DOM; the stack-based check
        // above cannot help here, so an extension container is skipped by name.
        if (parent.closest("[data-extension-id], [id*='extension']")) continue;
        const rect = parent.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        // `enqueue` dedupes by `type:message`, so a message that survives a
        // re-render is reported once per session.
        enqueue({
          type: "rendered_error_text",
          message: text.slice(0, 200),
          details: "matched signature: " + hit,
          source:
            parent.tagName.toLowerCase() + (parent.id ? "#" + parent.id : ""),
        });
        flush();
      }
    } catch (_) {
      /* telemetry must never throw into the app */
    }
  }

  // After the mount window, and again a beat after each SPA navigation — error
  // states usually appear on the first data round-trip, not at first paint.
  let errorScanTimer = null;
  function scheduleErrorTextScan() {
    if (errorScanTimer) clearTimeout(errorScanTimer);
    errorScanTimer = setTimeout(function () {
      errorScanTimer = null;
      scanRenderedErrorText();
    }, 3500);
  }
  window.addEventListener("load", scheduleErrorTextScan);

  // ---- pageviews ----------------------------------------------------------
  // The owner-facing traffic signal. Emitted on first paint and on every SPA
  // navigation, because this app is a client-side router: without the history
  // hooks below, a whole session would count as one visit to "/".
  let lastPath = null;
  function pageview() {
    try {
      const path = window.location.pathname + window.location.search;
      if (path === lastPath) return; // a replaceState that changed nothing
      lastPath = path;
      enqueue(
        {
          type: "pageview",
          message: window.location.pathname,
          meta: { sid: sessionId(), demo: isDemoVisit() },
        },
        { allowRepeat: true },
      );
      scheduleErrorTextScan();
    } catch (_) {
      /* telemetry must never throw into the app */
    }
  }

  // ---- custom events --------------------------------------------------------
  // `track(name, props)` from the site SDK lands here. Props are clamped on
  // the client and again by be-core: at most 10 keys, string/number/boolean.
  window.__joorchinTrack = function (name, props) {
    try {
      const clean = {};
      let count = 0;
      if (props && typeof props === "object") {
        Object.keys(props).forEach(function (key) {
          const value = props[key];
          if (count >= 10) return;
          if (typeof value === "string") clean[key] = trim(value, 200);
          else if (typeof value === "number" && isFinite(value))
            clean[key] = value;
          else if (typeof value === "boolean") clean[key] = value;
          else return;
          count += 1;
        });
      }
      enqueue(
        {
          type: "site_event",
          message: String(name),
          meta: { sid: sessionId(), demo: isDemoVisit(), props: clean },
        },
        { allowRepeat: true },
      );
    } catch (_) {
      /* telemetry must never throw into the app */
    }
  };

  const history = window.history;
  ["pushState", "replaceState"].forEach(function (name) {
    const orig = history && history[name];
    if (typeof orig !== "function") return;
    history[name] = function () {
      const result = orig.apply(history, arguments);
      pageview();
      return result;
    };
  });
  window.addEventListener("popstate", pageview);
  window.addEventListener("hashchange", pageview);
  pageview();

  // Final flush on unload.
  window.addEventListener("pagehide", flush);
  window.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
})();
