import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { VitePWA } from "vite-plugin-pwa";
import joorchinVitePlugin from "./vite-plugin/index.js";
import { pwaConfig } from "./src/config/pwa.js";

const packageDependencies = Object.keys(
  createRequire(import.meta.url)("./package.json").dependencies || {},
).filter((name) => !name.startsWith("@babel/") && !name.startsWith("@joorchin/"));
const optimizedDependencies = [
  ...packageDependencies,
  "react-dom/client",
  "react/jsx-runtime",
];

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE || process.env.VITE_BASE || "/";
  const appId =
    env.VITE_APP_ID || process.env.VITE_APP_ID || "6af94b7c9d74546f10baf82f";
  const serverTarget =
    env.VITE_JOORCHIN_SERVER_URL ||
    process.env.VITE_JOORCHIN_SERVER_URL ||
    env.JOORCHIN_CORE_URL ||
    process.env.JOORCHIN_CORE_URL ||
    "https://api.joorchin.site";

  return {
    base,
    define: {
      "import.meta.env.VITE_APP_ID": JSON.stringify(appId),
      "import.meta.env.VITE_JOORCHIN_SERVER_URL": JSON.stringify(serverTarget),
    },
    optimizeDeps: {
      include: optimizedDependencies,
    },
    build: {
      sourcemap: "hidden",
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, "index.html"),
        },
      },
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": resolve(import.meta.dirname, "src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: serverTarget,
          changeOrigin: true,
          secure: true,
        },
      },
      fs: {
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.joorchin/**"],
      },
    },
    plugins: [
      react(),
      ...((command === "serve" || pwaConfig.enabled === false)
        ? [
            {
              name: "joorchin-pwa-registration-disabled",
              enforce: "pre",
              resolveId(id) {
                return id === "virtual:pwa-register"
                  ? "\0joorchin:pwa-disabled"
                  : undefined;
              },
              load(id) {
                return id === "\0joorchin:pwa-disabled"
                  ? "export const registerSW = () => () => Promise.resolve();"
                  : undefined;
              },
            },
          ]
        : []),
      ...joorchinVitePlugin({
        hmrNotifier: true,
      }),
      VitePWA({
        disable: pwaConfig.enabled === false,
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        includeAssets: [
          "icons/icon-192.png",
          "icons/icon-512.png",
          "offline.html",
        ],
        manifest: {
          name: pwaConfig.name || "JERKA",
          short_name: pwaConfig.shortName || "JERKA",
          description: pwaConfig.description || "Luxury Storefront",
          theme_color: pwaConfig.themeColor || "#99002e",
          background_color: pwaConfig.backgroundColor || "#ffffff",
          display: pwaConfig.display || "standalone",
          lang: pwaConfig.lang || "fa",
          dir: pwaConfig.dir || "rtl",
          start_url: pwaConfig.startUrl || "/",
          scope: pwaConfig.scope || "/",
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        },
      }),
    ],
  };
});
