/**
 * Fallback reporter for Vite's default error overlay (vite-error-overlay).
 * Runs when the custom ErrorOverlay patch is missing on an older preview build.
 */
(function () {
  if (window.self === window.top) return;

  let lastSignature = "";

  function report(title, details, meta) {
    const signature = `${title}\n${details ?? ""}`;
    if (!title || signature === lastSignature) return;
    lastSignature = signature;

    window.parent?.postMessage(
      {
        type: "app_error",
        error: {
          title,
          details,
          file: meta?.file,
          plugin: meta?.plugin,
        },
      },
      "*"
    );
  }

  function extractFromOverlay(overlay) {
    const root = overlay.shadowRoot;
    if (!root) return;

    const plugin = root.querySelector(".plugin")?.textContent?.trim();
    const message = root.querySelector(".message-body")?.textContent?.trim();
    const file = root.querySelector(".file")?.textContent?.trim();
    const frame = root.querySelector(".frame")?.textContent?.trim();
    const stack = root.querySelector(".stack")?.textContent?.trim();

    if (!message) return;

    const title = plugin ? `${plugin} ${message}` : message;
    const detailsParts = [];
    if (file) detailsParts.push(`File: ${file}`);
    if (frame) detailsParts.push(frame);
    if (stack) detailsParts.push(stack);

    report(title, detailsParts.join("\n\n"), {
      file,
      plugin: plugin?.match(/\[plugin:([^\]]+)\]/)?.[1]?.trim(),
    });
  }

  function scanForOverlay() {
    const overlay = document.querySelector("vite-error-overlay");
    if (overlay) extractFromOverlay(overlay);
  }

  const observer = new MutationObserver(scanForOverlay);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scanForOverlay();
})();

export {};
