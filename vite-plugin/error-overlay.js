/// <reference lib="dom" />

// Joorchin error overlay (vendored, base44-free).
// Replaces Vite's built-in ErrorOverlay so runtime errors in the preview app
// are forwarded to the parent studio via postMessage instead of rendering a
// full-screen overlay inside the iframe.

// Make HTMLElement available in non-browser environments
const { HTMLElement = class {} } = globalThis;

export class ErrorOverlay extends HTMLElement {
  static getOverlayHTML() {
    return `
      <div>
			</div>
    `;
  }
  close() {
    this.parentNode?.removeChild(this);
  }

  static sendErrorToParent(error, title, details, componentName, meta = {}) {
    // Send error to parent studio
    if (globalThis.window?.parent) {
      try {
        globalThis.window.parent?.postMessage(
          {
            type: "app_error",
            error: {
              title,
              details,
              componentName,
              file: meta.file,
              plugin: meta.plugin,
            },
          },
          "*"
        );
      } catch (error) {
        console.warn(
          "Failed to send error to iframe parent:",
          error?.message
        );
      }
    }
  }

  constructor(error, links = true) {
    super();
    void links;

    const stack = error?.stack;
    let componentName = stack?.match(/at\s+(\w+)\s+\(eval/)?.[1];
    if (componentName === "eval") {
      componentName = undefined;
    }

    const plugin = error?.plugin ? String(error.plugin) : undefined;
    const loc = error?.loc;
    const filePath = loc?.file || error?.id?.split("?")[0];
    const file =
      filePath && loc?.line
        ? `${filePath}:${loc.line}:${loc.column ?? 0}`
        : filePath;

    let title = error?.message?.toString() || "Unknown error";
    if (plugin) {
      title = `[plugin:${plugin}] ${title}`;
    } else if (componentName) {
      title = `in ${componentName}: ${title}`;
    }

    const detailsParts = [];
    if (file) detailsParts.push(`File: ${file}`);
    if (error?.frame) detailsParts.push(String(error.frame).trim());
    if (error?.stack) detailsParts.push(String(error.stack));
    const details = detailsParts.join("\n\n") || undefined;

    // Forward the error to the editor frame (via post message)
    ErrorOverlay.sendErrorToParent(error, title, details, componentName, {
      file,
      plugin,
    });

    // Create the overlay element using HTML template
    const overlay = document.createElement("div");
    overlay.innerHTML = ErrorOverlay.getOverlayHTML();

    // Add to DOM
    document.body.appendChild(overlay);
  }
}

// vite/react-plugin transpiles classes with _SomeClass, so we need to replace
// all _ErrorOverlay with ErrorOverlay
export const errorOverlayCode = ErrorOverlay.toString().replaceAll(
  "_ErrorOverlay",
  "ErrorOverlay"
);
