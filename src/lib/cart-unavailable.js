/**
 * Platform-owned cart fallback contract. Identity lives here so a failed
 * plugin load cannot mint a second Error class or a silently-succeeding cart.
 */

export class CartUnavailableError extends Error {
  constructor(message = "Cart is temporarily unavailable") {
    super(message);
    this.name = "CartUnavailableError";
  }
}

function rejectUnavailable() {
  return Promise.reject(new CartUnavailableError());
}

/**
 * Empty reads, throwing writes. A no-op mutator would look like the button
 * worked while checkout silently lost the item.
 */
export function createNullCartValue() {
  return {
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    shippingCost: 0,
    total: 0,
    currency: "IRR",
    couponCode: "",
    shipping: null,
    count: 0,
    loading: false,
    error: "",
    unavailable: true,
    addItem: rejectUnavailable,
    updateItem: rejectUnavailable,
    removeItem: rejectUnavailable,
    clear: rejectUnavailable,
    add: rejectUnavailable,
    update: rejectUnavailable,
    remove: rejectUnavailable,
    applyCoupon: rejectUnavailable,
    removeCoupon: rejectUnavailable,
    setShipping: rejectUnavailable,
  };
}
