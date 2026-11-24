/**
 * JERKA route table — DERIVED from the page files by the same pageRoutePath
 * the platform entry uses (src/lib/page-routes.js), so a hand-typed path can
 * never drift from the mounted route (the /shop/order-success vs
 * /shop/ordersuccess class of bug — see be/core scaffold routes.ts).
 */
import { pageRoutePath } from '@/lib/page-routes';

const SHOP_PAGE_FILES = {
  productList: 'src/pages/Shop/ProductList.jsx',
  productDetail: 'src/pages/Shop/ProductDetail/[id].jsx',
  cart: 'src/pages/Shop/Cart.jsx',
  checkout: 'src/pages/Shop/Checkout.jsx',
  orderSuccess: 'src/pages/Shop/OrderSuccess.jsx',
};

function routeOf(file) {
  const path = pageRoutePath(file);
  if (!path) throw new Error(`jerka routes: ${file} is not a routable page`);
  return path;
}

/** The URLs the platform entry actually serves for these page files. */
export const ROUTES = {
  home: '/',
  // The storefront-wide "shop" alias — the product listing. Derived, not
  // hand-typed, so it can never drift from the mounted route.
  shop: routeOf(SHOP_PAGE_FILES.productList),
  ...Object.fromEntries(
    Object.entries(SHOP_PAGE_FILES).map(([key, file]) => [key, routeOf(file)]),
  ),
};

/** Product-detail link for an id, from the derived :id route. */
export function productRoute(id) {
  return ROUTES.productDetail.replace(/:[A-Za-z0-9_]+$/, encodeURIComponent(id));
}

export default ROUTES;
