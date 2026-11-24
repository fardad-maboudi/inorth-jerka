/**
 * Notifies Studio (parent frame) when the generated app's client route changes.
 * Cross-origin preview iframe — parent cannot read location; postMessage only.
 */
(function () {
  if (window.__joorchinPreviewRouteNotifier) return;
  window.__joorchinPreviewRouteNotifier = true;

  function currentRoute() {
    const pathname = window.location.pathname || "/";
    const search = window.location.search || "";
    return { pathname, search, href: `${pathname}${search}` };
  }

  function notify() {
    window.parent?.postMessage(
      { type: "preview:route-change", payload: currentRoute() },
      "*",
    );
  }

  window.addEventListener("popstate", notify);

  const wrapHistory = (method) => {
    const original = history[method];
    if (typeof original !== "function") return;
    history[method] = function (...args) {
      const result = original.apply(this, args);
      notify();
      return result;
    };
  };

  wrapHistory("pushState");
  wrapHistory("replaceState");

  notify();
})();
