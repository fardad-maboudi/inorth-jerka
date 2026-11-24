import path from "node:path";
import { loadEnv } from "vite";
import { errorOverlayPlugin } from "./error-overlay-plugin.js";
import { visualEditPlugin } from "./visual-edit-plugin.js";
import { filterPackagesInProject } from "./utils.js";
import { htmlInjectionsPlugin } from "./html-injections-plugin.js";

// Joorchin Vite plugin (vendored, base44-free).
//
// This is an in-repo fork of what used to be `@base44/vite-plugin`. It ships as
// plain ESM source under be/vps/generated-site/vite-plugin/ (NOT an npm package)
// so the isolated Docker build doesn't need registry/workspace resolution — the
// directory is rsync'd into every app and COPY'd in the prod image.
//
// The legacy base44-SDK compat layer (legacySDKImports / compat/*) has been
// dropped: Joorchin apps use the Joorchin entity API, not `@base44/sdk`.
//
// The preview-only sub-plugins (tagging, iframe CORS, error overlay, HMR)
// run in ANY dev server — local `pnpm dev` included — because they self-gate on
// `apply: mode === "development"` / `apply: "serve"`, so prod `vite build`
// excludes them regardless. Runtime telemetry is the exception: it is injected
// in production builds too, so published sites fill the admin Runtime tab.
// Only the container-specific *server* settings (forced port 5173 / host 0.0.0.0)
// stay gated behind the real MODAL_SANDBOX_ID env var, since locally we want the
// default/CLI port, not the container's fixed one.

const isRunningInSandbox = !!process.env.MODAL_SANDBOX_ID;

export default function joorchinVitePlugin(opts = {}) {
  const { hmrNotifier = false } = opts;

  return [
    {
      name: "joorchin",
      config: ({ mode, root = process.cwd() }) => {
        // loadEnv is called for parity with the original; kept in case future
        // config needs env-derived values.
        loadEnv(mode ?? "development", root, "");

        return {
          resolve: {
            alias: {
              "@": path.resolve(root, "src"),
            },
          },
          ...(isRunningInSandbox
            ? {
                server: {
                  cors: true,
                  host: "0.0.0.0", // Bind to all interfaces for container access
                  port: 5173,
                  strictPort: true,
                  // Allow all hosts - essential for tunnel/proxy URLs
                  allowedHosts: true,
                  watch: {
                    // Enable polling for reliable file change detection in containers
                    usePolling: true,
                    interval: 100,
                  },
                },
                build: {
                  rollupOptions: {
                    onwarn(warning, warn) {
                      // Treat import errors as fatal
                      if (
                        warning.code === "UNRESOLVED_IMPORT" ||
                        warning.code === "MISSING_EXPORT"
                      ) {
                        throw new Error(`Build failed: ${warning.message}`);
                      }
                      warn(warning);
                    },
                  },
                },
              }
            : {}),
          optimizeDeps: {
            ...(isRunningInSandbox
              ? {
                  include: filterPackagesInProject(
                    [
                      "react",
                      "react-dom",
                      "framer-motion",
                      "lodash",
                      "moment",
                      "react-quill",
                    ],
                    root
                  ),
                }
              : {}),
            esbuildOptions: {
              loader: {
                ".js": "jsx",
              },
            },
          },
        };
      },
    },
    // Preview-only sub-plugins self-gate to serve/dev. Runtime telemetry is
    // registered too (spread from htmlInjectionsPlugin) and MUST run in
    // production builds so published sites fill the admin Runtime tab.
    {
      name: "iframe-hmr",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Allow iframe embedding
          res.setHeader("X-Frame-Options", "ALLOWALL");
          res.setHeader("Content-Security-Policy", "frame-ancestors *;");
          next();
        });
      },
    },
    errorOverlayPlugin(),
    visualEditPlugin(),
    // Returns [preview-only, runtime-telemetry]. Telemetry must be spread in
    // so Vite registers both; nesting the array would drop them.
    ...htmlInjectionsPlugin({ hmrNotifier }),
    {
      name: "joorchin-full-reload",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || "").split("?")[0];
          const isReload =
            url === "/__joorchin_full_reload" ||
            url.endsWith("/__joorchin_full_reload");
          if (!isReload) return next();
          if (req.method !== "POST" && req.method !== "GET") return next();
          server.ws.send({ type: "full-reload", path: "*" });
          res.statusCode = 204;
          res.end();
        });
      },
    },
  ];
}
