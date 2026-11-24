import { errorOverlayCode } from "./error-overlay.js";

// Joorchin error-overlay plugin (vendored, base44-free).
// Patches Vite's dev client to swap in our ErrorOverlay (see error-overlay.js).
export function errorOverlayPlugin() {
  return {
    name: "error-overlay",
    apply: (config) => config.mode === "development",
    transform(code, id, opts = {}) {
      if (opts?.ssr) return;

      if (!id.includes("vite/dist/client/client.mjs")) return;

      const injected = errorOverlayCode + "\n";

      // Vite 7+ uses `var ErrorOverlay = class …`; older versions use `class ErrorOverlay`.
      if (code.includes("var ErrorOverlay = class extends HTMLElement")) {
        return code.replace(
          "var ErrorOverlay = class extends HTMLElement",
          injected + "var OldErrorOverlay = class extends HTMLElement"
        );
      }

      if (code.includes("class ErrorOverlay")) {
        return code.replace(
          "class ErrorOverlay",
          injected + "class OldErrorOverlay"
        );
      }

      return;
    },
  };
}
