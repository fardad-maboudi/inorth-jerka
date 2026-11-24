import { createContext, useContext } from 'react';

/**
 * Lets any page/card inside <Layout> open the mini-cart drawer without prop
 * drilling or DOM events. Layout provides the real implementation; outside a
 * Layout the calls are silent no-ops.
 */
export const CartDrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}
