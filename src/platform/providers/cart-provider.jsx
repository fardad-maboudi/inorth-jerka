/**
 * Plugin-owned cart behaviour, shipped in the base image so App.jsx can
 * statically import it. Activation is the plugins.js manifest, not the
 * module graph.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getCart,
  addToCart as apiAdd,
  updateCartItem as apiUpdate,
  removeFromCart as apiRemove,
  clearCart as apiClear,
  applyCoupon as apiApplyCoupon,
  removeCoupon as apiRemoveCoupon,
  setShipping as apiSetShipping,
} from "@/api/plugins/ecommerce";
import { DEFAULT_CURRENCY } from "@/lib/money";
import { CartContext } from "@/lib/cart-context";

const EMPTY = {
  items: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  shippingCost: 0,
  total: 0,
  currency: DEFAULT_CURRENCY,
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = useCallback(async (op) => {
    setError("");
    try {
      const next = await op();
      setCart(next || EMPTY);
      return next;
    } catch (err) {
      setError(err?.message || "Cart error");
      throw err;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await getCart();
        if (active) setCart(next || EMPTY);
      } catch {
        if (active) setCart(EMPTY);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(
    (productId, qty = 1) => run(() => apiAdd(productId, qty)),
    [run],
  );
  const update = useCallback(
    (productId, qty) => run(() => apiUpdate(productId, qty)),
    [run],
  );
  const remove = useCallback(
    (productId) => run(() => apiRemove(productId)),
    [run],
  );
  const clear = useCallback(() => run(() => apiClear()), [run]);
  const applyCoupon = useCallback(
    (code) => run(() => apiApplyCoupon(code)),
    [run],
  );
  const removeCoupon = useCallback(
    () => run(() => apiRemoveCoupon()),
    [run],
  );
  const setShipping = useCallback(
    (methodId, address) => run(() => apiSetShipping(methodId, address)),
    [run],
  );

  const items = cart.items || [];
  const count = items.reduce((sum, i) => sum + (i.qty || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal: cart.subtotal || 0,
        discount: cart.discount || 0,
        tax: cart.tax || 0,
        shippingCost: cart.shippingCost || 0,
        total: cart.total || 0,
        currency: cart.currency || DEFAULT_CURRENCY,
        couponCode: cart.couponCode || "",
        shipping: cart.shipping || null,
        count,
        loading,
        error,
        unavailable: false,
        add,
        update,
        remove,
        clear,
        addItem: add,
        updateItem: update,
        removeItem: remove,
        applyCoupon,
        removeCoupon,
        setShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
