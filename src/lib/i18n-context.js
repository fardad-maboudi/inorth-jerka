/**
 * Platform-owned i18n context identity + fallback. Plugin-owned catalogues
 * live in `src/locales/*.json`; the provider body is
 * `src/platform/providers/i18n-provider.jsx`.
 *
 * `useI18n()` is safe to call only under a provider. When i18n is enabled the
 * platform always mounts either the real provider or `NullI18nProvider`, so
 * "consumer without provider" is not a reachable state for a multilingual app.
 */
import { createContext, useContext, useEffect, createElement } from "react";
import {
  I18nUnavailableError,
  createNullI18nValue,
} from "./i18n-unavailable.js";

export { I18nUnavailableError, createNullI18nValue };

export const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a <I18nProvider>");
  }
  return ctx;
}

function beaconI18nUnavailable() {
  try {
    window.__joorchinTelemetry?.report({
      type: "i18n_unavailable",
      message:
        "I18nUnavailableError: i18n enabled but I18nProvider failed to load",
      meta: { plugin: "i18n" },
    });
  } catch {
    /* telemetry must never throw into the app */
  }
}

/** t() returns the key; setLocale throws I18nUnavailableError. */
export function NullI18nProvider({ children }) {
  useEffect(() => {
    beaconI18nUnavailable();
  }, []);
  return createElement(
    I18nContext.Provider,
    { value: createNullI18nValue() },
    children,
  );
}

/** Suspense-fallback provider: null i18n value without the unavailable beacon. */
export function PendingI18nProvider({ children }) {
  return createElement(
    I18nContext.Provider,
    { value: createNullI18nValue() },
    children,
  );
}
