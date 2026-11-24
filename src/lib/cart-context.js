/**
 * Platform-owned cart context identity + fallback. Plugin-owned behaviour
 * (API, totals, coupons) lives in `src/platform/providers/cart-provider.jsx`.
 *
 * `useCart()` is safe to call only under a provider. When ecommerce is enabled
 * the platform always mounts either the real provider or `NullCartProvider`,
 * so "consumer without provider" is not a reachable state for a shop.
 */
import { createContext, useContext, useEffect, createElement } from "react";
import {
  CartUnavailableError,
  createNullCartValue,
} from "./cart-unavailable.js";

export { CartUnavailableError, createNullCartValue };

export const CartContext = createContext(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return ctx;
}

function beaconCartUnavailable() {
  try {
    window.__joorchinTelemetry?.report({
      type: "cart_unavailable",
      message:
        "CartUnavailableError: ecommerce enabled but CartProvider failed to load",
      meta: { plugin: "ecommerce" },
    });
  } catch {
    /* telemetry must never throw into the app */
  }
}

/** Reads empty; writes throw CartUnavailableError. Beacons a blocking runtime event. */
export function NullCartProvider({ children }) {
  useEffect(() => {
    beaconCartUnavailable();
  }, []);
  return createElement(
    CartContext.Provider,
    { value: createNullCartValue() },
    children,
  );
}

/**
 * Suspense-fallback provider: same empty-cart value as NullCartProvider but
 * WITHOUT the cart_unavailable beacon. The lazy chunk loading briefly (cold
 * start) is normal, not a platform defect — beaconing here made every fresh
 * shop build look broken to the runtime validator and forced a degrade.
 */
export function PendingCartProvider({ children }) {
  return createElement(
    CartContext.Provider,
    { value: createNullCartValue() },
    children,
  );
}
