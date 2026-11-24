/// <reference types="vite/client" />
window.removeEventListener("unhandledrejection", handleUnhandledRejection);
window.removeEventListener("error", handleWindowError);
window.addEventListener("unhandledrejection", handleUnhandledRejection);
window.addEventListener("error", handleWindowError);
let shouldPropagateErrors = true;
let suppressionTimer = null;
if (import.meta.hot) {
    import.meta.hot.on("vite:beforeUpdate", () => {
        shouldPropagateErrors = false;
        if (suppressionTimer) {
            clearTimeout(suppressionTimer);
        }
        suppressionTimer = setTimeout(() => {
            shouldPropagateErrors = true;
            suppressionTimer = null;
        }, import.meta.env.VITE_HMR_ERROR_SUPPRESSION_DELAY ?? 10000);
    });
    import.meta.hot.on("vite:beforeFullReload", () => {
        shouldPropagateErrors = false;
        if (suppressionTimer) {
            clearTimeout(suppressionTimer);
            suppressionTimer = null;
        }
    });
}
/**
 * Browser extensions (wallets, ad blockers, password managers) run injected
 * scripts in this page's context. A rejection escaping one of those scripts
 * lands on `window` exactly like an app bug, but the site neither caused it nor
 * can fix it. Same rule as public/runtime-telemetry.js.
 */
const EXTENSION_ORIGIN = /(?:chrome|moz|safari|edge|chrome-untrusted)-extension:\/\//i;
function isExtensionOrigin(err) {
    if (!err)
        return false;
    if (typeof err.stack === "string" && EXTENSION_ORIGIN.test(err.stack))
        return true;
    return EXTENSION_ORIGIN.test(String(err.message || err));
}
function onAppError({ title, details, componentName, originalError, }) {
    if (originalError?.response?.status === 402 || !shouldPropagateErrors) {
        return;
    }
    if (isExtensionOrigin(originalError)) {
        return;
    }
    window.parent?.postMessage({
        type: "app_error",
        error: {
            title: title.toString(),
            details: details?.toString(),
            componentName: componentName?.toString(),
        },
    }, "*");
}
function handleUnhandledRejection(event) {
    const stack = event.reason?.stack ?? "";
    // extract function name from "at X (eval" where x is the function name
    const functionName = stack.match(/at\s+(\w+)\s+\(eval/)?.[1];
    const msg = functionName
        ? `Error in ${functionName}: ${event.reason.toString()}`
        : event.reason.toString();
    onAppError({
        title: msg,
        details: String(event.reason),
        componentName: functionName,
        originalError: event.reason,
    });
}
function handleWindowError(event) {
    const stack = event.error?.stack ?? "";
    let functionName = stack.match(/at\s+(\w+)\s+\(eval/)?.[1];
    if (functionName === "eval") {
        functionName = null;
    }
    const msg = functionName
        ? `in ${functionName}: ${event.error.toString()}`
        : event.error.toString();
    onAppError({
        title: msg,
        details: event.error.toString(),
        componentName: functionName,
        originalError: event.error,
    });
}
export {};
//# sourceMappingURL=unhandled-errors-handlers.js.map