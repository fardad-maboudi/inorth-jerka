import { joorchinFetch as fetch } from "../joorchin.js";
import { normalizeIranianMobile, formatIranianMobile, toLatinDigits } from '../auth.js';
/**
 * E-commerce plugin client for this generated app.
 * Products, categories, the cart and orders are all backed by the Joorchin
 * server. NEVER compute or send an order total from the browser — the server
 * recomputes prices at checkout (anti-tampering). Import from
 * '@/api/plugins/ecommerce'; do not hardcode URLs.
 */
import { useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '../auth.js';
import {
  listPluginRecords,
  getPluginRecord,
  parseJoorchinResponse,
  joorchinFetch,
  requestAppApi,
  asRowList,
  APP_ID,
  appUrl,
  asPaymentOutcome,
  isSandboxPayment,
  normalizeGatewayReturn,
  paymentRedirectOf,
  redirectToPayment,
} from '@/api/joorchin';
export { isSandboxPayment, normalizeGatewayReturn, paymentRedirectOf, redirectToPayment };
import { queryKeys } from '@/api/hooks';
export { formatPrice, formatMoney, DEFAULT_CURRENCY } from '@/lib/money';

const PLUGIN_ID = 'ecommerce';
/** Canonical visitor paths derived from the required page-file table. */
export const SHOP_ROUTES = {"productList":"/shop/products","shopIndex":"/shop","productDetail":"/shop/product-detail/:id","cart":"/shop/cart","checkout":"/shop/checkout","orderSuccess":"/shop/order-success","cardToCard":"/shop/card-to-card/:authority","account":"/shop/account","orders":"/shop/account/orders","orderDetail":"/shop/account/orders/:id","addresses":"/shop/account/addresses","profile":"/shop/account/profile"};
const BASE = `/api/v1/apps/${APP_ID}/plugins/${PLUGIN_ID}`;
const SESSION_KEY = 'joorchin_cart_session';

/** Stable per-browser id so guests keep a cart across reloads. */
function cartSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      'cs_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Opt in only where the server consumes cart identity or payment surface.
function headers(json = false, { cart = false, surface = false } = {}) {
  const h = { ...getAuthHeaders() };
  if (cart) h['x-cart-session'] = cartSession();
  if (surface && typeof window !== 'undefined' && /(?:^|\/)miniapp(?:\/|$)/.test(window.location.pathname)) {
    h['x-joorchin-surface'] = 'telegram-miniapp';
  }
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

/**
 * A list-shaped query param the caller may pass as an array OR a bare string.
 * `tags: 'sale'` and `tags: ['sale', 'new']` mean the same thing, and the
 * signature never said which was required — app 6aadbb9e89eef57f2770a8ee
 * (2026-09-19) printed `params.tags.join is not a function` on its home page
 * because only the array form worked. `attributes` below has always accepted
 * both; this makes every list param behave the same way.
 */
function csvParam(value) {
  const list = Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  return list
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .join(',');
}

async function trackMiniApp(event, itemId) {
  if (typeof window === 'undefined' || !/(?:^|\/)miniapp(?:\/|$)/.test(window.location.pathname)) return;
  await requestAppApi('plugins/telegram/miniapp/event', {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ event, ...(itemId ? { itemId: String(itemId) } : {}) }),
  }).catch(() => undefined);
}

/**
 * Shared error boundary: failed or non-JSON responses throw an Error whose
 * `message` is short Persian copy (never a proxy's HTML body) with `status`,
 * `code` and `diagnostic` kept for branching and logs. Network failures go
 * through `joorchinFetch`, which maps "Failed to fetch" the same way.
 */
function parse(response) {
  return parseJoorchinResponse(response);
}

async function fetchAfterPreviewRouteSettles(url, init) {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (!(error instanceof TypeError) && !(error?.cause instanceof TypeError)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 150));
    return joorchinFetch(url, init);
  }
}

/*
 * Every list helper below resolves to an Array that ALSO answers to `.items`
 * / `.data` / `.results` / `.rows` / `.total` (see `asRowList` in
 * `@/api/joorchin`). `rows.map(...)` and `rows.items.map(...)` are both
 * correct — there is no response shape to guess.
 */

/**
 * Persian headings for common attribute keys, used only when no attribute
 * definition row names the key. A generic seed printed «color / size» verbatim
 * on product pages (app 6ab4d99a3f89e4693e72bfb4). Unknown keys fall back to
 * the key itself.
 */
export const ATTRIBUTE_LABELS = {
  color: 'رنگ', colour: 'رنگ', size: 'سایز', material: 'جنس', weight: 'وزن',
  dimensions: 'ابعاد', brand: 'برند', model: 'مدل', warranty: 'گارانتی',
  storage: 'حافظه', capacity: 'ظرفیت', origin: 'کشور سازنده', karat: 'عیار',
  purity: 'عیار', style: 'سبک', gender: 'جنسیت', pattern: 'طرح', volume: 'حجم',
  fit: 'فرم', season: 'فصل',
};

function fallbackAttributeLabel(key) {
  const name = String(key ?? '');
  return ATTRIBUTE_LABELS[name] || ATTRIBUTE_LABELS[name.toLowerCase()] || name;
}

/**
 * Product rows never carry a rating. Seeded catalogs once stored a fabricated
 * `rating` / `reviewCount`, and cards rendered it next to a detail page
 * that showed the (empty) approved-review summary. The only rating source is
 * approved reviews: `reviewSummaries(ids)` from '@/api/plugins/reviews'.
 */
function withoutUnapprovedRating(row) {
  if (row && typeof row === 'object') {
    delete row.rating;
    delete row.reviewCount;
  }
  return row;
}

function withoutUnapprovedRatings(rows) {
  if (Array.isArray(rows)) for (const row of rows) withoutUnapprovedRating(row);
  return rows;
}

// --- Catalog ---------------------------------------------------------------
/**
 * Active products, newest first by default.
 * @param {{filter?:Record<string,unknown>,sort?:string,limit?:number,skip?:number}} [options]
 * @returns {Promise<Array<Record<string,unknown>>>} product rows (`.items` also works).
 * @example
 * const products = await listProducts({ sort: '-created_at', limit: 12 });
 * products.map((p) => p.title);
 */
export async function listProducts({ filter, sort, limit, skip } = {}) {
  return withoutUnapprovedRatings(await listPluginRecords(PLUGIN_ID, 'product', {
    filter: { active: true, ...(filter || {}) },
    sort,
    limit,
    skip,
  }));
}

/** Aliases — LLMs invent getProducts/fetchProducts; keep both names working. */
export const getProducts = listProducts;
export const fetchProducts = listProducts;

/**
 * Attribute definitions are the only place the Persian heading for an attribute
 * lives; `product.attributes` is a bare { key: value } map. Product pages that
 * rendered the map directly printed the storage keys — a real shop showed
 * "warranty / storage / color" above Persian values while the filter sidebar
 * beside it showed «گارانتی / حافظه / رنگ» (app 6aa945cf9fcddbf0b914386c).
 * Cached for the page's lifetime: definitions change far less often than views.
 */
let attributeDefsPromise = null;
function attributeDefs() {
  if (!attributeDefsPromise) {
    attributeDefsPromise = listAttributes().catch(() => []);
  }
  return attributeDefsPromise;
}

/**
 * Returns the product plus `attributeList`: [{ key, label, value }] already
 * resolved to display labels and ordered like the storefront filters. Render
 * that — never Object.entries(product.attributes), which yields storage keys.
 * @param {string} id
 * @returns {Promise<import('../plugin-models.js').EcommerceProductRow & {attributeList: Array<{key: string, label: string, value: unknown}>}>}
 */
export async function getProduct(id) {
  const [product, defs] = await Promise.all([
    getPluginRecord(PLUGIN_ID, 'product', id),
    attributeDefs(),
  ]);
  await trackMiniApp('product_view', id);
  if (!product || typeof product !== 'object') return product;
  withoutUnapprovedRating(product);
  const map = product.attributes && typeof product.attributes === 'object' ? product.attributes : {};
  const rows = Array.isArray(defs) ? defs : [];
  const known = rows
    .filter((row) => row && row.key in map)
    .map((row) => ({ key: row.key, label: row.name || fallbackAttributeLabel(row.key), value: map[row.key] }));
  const extra = Object.keys(map)
    .filter((key) => !rows.some((row) => row && row.key === key))
    .map((key) => ({ key, label: fallbackAttributeLabel(key), value: map[key] }));
  return { ...product, attributeList: [...known, ...extra] };
}

/**
 * Localized attribute title; unknown agent-defined keys fall back to the storage key.
 * @param {string} key
 * @param {Array<{key?:string,name?:string}>=} attributes
 * @returns {string}
 */
export function attributeLabel(key, attributes = []) {
  const row = (attributes || []).find((a) => a && a.key === key);
  return (row && row.name) || fallbackAttributeLabel(key);
}

/**
 * @param {Record<string,unknown>=} params
 * @returns {Promise<Array<Record<string,unknown>>>}
 */
export async function listAttributes(params = {}) {
  return listPluginRecords(PLUGIN_ID, 'attribute', { sort: 'order', ...params });
}

/**
 * Faceted search: filter by text, category, price range, tags and dynamic
 * attributes. `tags` takes one tag or an array of them; `attributes` is a
 * map like { color: 'red', size: ['L','XL'] }.
 * @param {Omit<Partial<import('./ecommerce-contracts.js').ProductSearchQuery>, 'tags'> & {tags?:string|string[],attributes?:Record<string,string|string[]>}} [params]
 * @returns {Promise<import('./ecommerce-contracts.js').ProductSearchResponse['items']>} an Array — matching product rows, with `.total` for the
 *   unpaged count and `.facets` when requested (`.items` also works).
 * @example
 * const result = await searchProducts({ q: 'کفش', minPrice: 100000, attributes: { color: ['red'] }, facets: 'true' });
 * result.total; result.facets;
 */
export async function searchProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.skip != null) qs.set('skip', String(params.skip));
  if (params.facets) qs.set('facets', 'true');
  if (params.inStock) qs.set('inStock', 'true');
  const tagList = csvParam(params.tags);
  if (tagList) qs.set('tags', tagList);
  if (params.attributes) {
    for (const [k, v] of Object.entries(params.attributes)) {
      if (v == null || v === '') continue;
      qs.set('attr.' + k, Array.isArray(v) ? v.join(',') : String(v));
    }
  }
  return withoutUnapprovedRatings(asRowList(await parse(await joorchinFetch(`${BASE}/products/search?${qs.toString()}`, { headers: headers() }))));
}

/**
 * Available filter facets + value counts for the catalog (optionally a category).
 * @param {Record<string,unknown>=} params
 * @returns {Promise<import('./ecommerce-contracts.js').FacetsResponse>}
 */
export async function getFacets(params = {}) {
  const qs = new URLSearchParams();
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  return parse(await joorchinFetch(`${BASE}/products/facets?${qs.toString()}`, { headers: headers() }));
}

/**
 * Store-wide settings (currency, tax, contact) — storefront-safe fields only.
 * @returns {Promise<import('./ecommerce-contracts.js').StoreSettingsResponse>}
 */
export async function getStoreSettings() {
  return parse(await joorchinFetch(`${BASE}/store/settings`, { headers: headers() }));
}

/**
 * One root/layout bootstrap: settings, delivery choices, pickup points and cold facets.
 * @returns {Promise<import('./ecommerce-contracts.js').StorefrontResponse>}
 */
export async function getStorefront() {
  return parse(await joorchinFetch(`${BASE}/storefront`, { headers: headers() }));
}

/**
 * Catalog categories, ordered by their `order` field.
 * @returns {Promise<Array<import('../plugin-models.js').EcommerceCategoryRow>>} an Array — category rows (`.items` also works).
 * @param {Record<string,unknown>=} params
 */
export async function listCategories(params = {}) {
  return listPluginRecords(PLUGIN_ID, 'category', { sort: 'order', ...params });
}

/** Aliases — LLMs invent getCategories/fetchCategories; keep both names working. */
export const getCategories = listCategories;
export const fetchCategories = listCategories;

/**
 * @param {string} id
 * @returns {Promise<import('../plugin-models.js').EcommerceCategoryRow>}
 */
export async function getCategory(id) {
  return getPluginRecord(PLUGIN_ID, 'category', id);
}

// --- Cart (server-owned; totals computed server-side) ----------------------
/** @returns {Promise<import('./ecommerce-contracts.js').CartResponse>} */
export async function getCart() {
  return parse(
    await fetchAfterPreviewRouteSettles(`${BASE}/cart`, {
      headers: headers(false, { cart: true }),
    }),
  );
}

/**
 * @param {string} productId
 * @param {number=} qty
 * @param {string=} variantId Unique variant SKU, required when variants exist.
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 * @example
 * const cart = await addToCart(product._id, 1); // returns the server-priced cart
 * cart.total;
 */
export async function addToCart(productId, qty = 1, variantId) {
  const cart = await parse(await joorchinFetch(`${BASE}/cart/items`, {
    method: 'POST',
    headers: headers(true, { cart: true }),
    body: JSON.stringify({ productId, qty, ...(variantId ? { variantId } : {}) }),
  }));
  await trackMiniApp('add_to_cart', productId);
  return cart;
}

/**
 * @param {string} lineId Server-returned line identity (base productId for non-variants).
 * @param {number} qty
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function updateCartItem(lineId, qty) {
  return parse(await joorchinFetch(`${BASE}/cart/items/${encodeURIComponent(lineId)}`, {
    method: 'PUT',
    headers: headers(true, { cart: true }),
    body: JSON.stringify({ qty }),
  }));
}

/**
 * @param {string} lineId
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function removeFromCart(lineId) {
  return parse(await joorchinFetch(`${BASE}/cart/items/${encodeURIComponent(lineId)}`, {
    method: 'DELETE',
    headers: headers(false, { cart: true }),
  }));
}

/**
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function clearCart() {
  return parse(await joorchinFetch(`${BASE}/cart`, {
    method: 'DELETE',
    headers: headers(false, { cart: true }),
  }));
}

/**
 * @param {string} code
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function applyCoupon(code) {
  return parse(await joorchinFetch(`${BASE}/cart/coupon`, {
    method: 'POST',
    headers: headers(true, { cart: true }),
    body: JSON.stringify({ code }),
  }));
}

/**
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function removeCoupon() {
  return parse(await joorchinFetch(`${BASE}/cart/coupon`, {
    method: 'DELETE',
    headers: headers(false, { cart: true }),
  }));
}

// --- Delivery --------------------------------------------------------------
/**
 * Delivery options the merchant offers at checkout. Each has a `kind`:
 * 'pickup' (collect in-store), 'manual', 'tipax' or 'iran_post'. For pickup
 * methods you can skip the shipping address and show pickup locations instead.
 * @returns {Promise<import('./ecommerce-contracts.js').ShippingMethodsResponse>}
 */
export async function getShippingMethods() {
  const data = await getStorefront();
  return data.shippingMethods;
}

/**
 * Iran provinces and their cities, owned and versioned by the backend.
 * @returns {Promise<import('./ecommerce-contracts.js').ShippingLocationsResponse>}
 */
export async function getShippingLocations() {
  return parse(await joorchinFetch(`${BASE}/shipping/locations`, { headers: headers() }));
}

/**
 * Store pickup points (for 'pickup' delivery methods).
 * @returns {Promise<import('./ecommerce-contracts.js').PickupLocationsResponse>}
 */
export async function getPickupLocations() {
  const data = await getStorefront();
  return data.pickupLocations;
}

/**
 * Select a shipping method + destination on the server cart and get the
 * re-priced cart back (server computes shippingCost + tax + total).
 * @param {string} methodId
 * @param {Record<string,unknown>|null|undefined} address
 * @param {{addressId?:string,pickupLocationId?:string}=} options
 * @returns {Promise<import('./ecommerce-contracts.js').CartResponse>}
 */
export async function setShipping(methodId, address, { addressId, pickupLocationId } = {}) {
  return parse(await joorchinFetch(`${BASE}/cart/shipping`, {
    method: 'POST',
    headers: headers(true, { cart: true }),
    body: JSON.stringify({
      methodId,
      address: address || {},
      ...(addressId ? { addressId } : {}),
      ...(pickupLocationId ? { pickupLocationId } : {}),
    }),
  }));
}

// --- Address book (signed-in shopper) --------------------------------------
/**
 * Saved shipping addresses, default first. Requires a signed-in shopper — a
 * guest has no address book and checks out with an inline address instead.
 * @returns {Promise<import('./ecommerce-contracts.js').ShopperAddressListResponse>}
 */
export async function listAddresses() {
  return asRowList(await parse(await joorchinFetch(`${BASE}/addresses`, { headers: headers() })));
}

/**
 * Save a new address. `province` and `city` must be values from
 * getShippingLocations(); the server validates that the city really belongs to
 * the province, normalizes the phone and requires a 10-digit postal code.
 * @param {Record<string,unknown>} address
 * @returns {Promise<import('./ecommerce-contracts.js').ShopperAddressResponse>}
 */
export async function createAddress(address) {
  return parse(await joorchinFetch(`${BASE}/addresses`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(address || {}),
  }));
}

/**
 * @param {string} addressId
 * @param {Record<string,unknown>} address
 * @returns {Promise<import('./ecommerce-contracts.js').ShopperAddressResponse>}
 */
export async function updateAddress(addressId, address) {
  if (!addressId) throw new Error('updateAddress requires an addressId');
  return parse(await joorchinFetch(`${BASE}/addresses/${addressId}`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify(address || {}),
  }));
}

/**
 * @param {string} addressId
 * @returns {Promise<Record<string,unknown>>}
 */
export async function deleteAddress(addressId) {
  if (!addressId) throw new Error('deleteAddress requires an addressId');
  return parse(await joorchinFetch(`${BASE}/addresses/${addressId}`, {
    method: 'DELETE',
    headers: headers(),
  }));
}

/**
 * Make one saved address the default. Returns the refreshed list.
 * @param {string} addressId
 * @returns {Promise<import('./ecommerce-contracts.js').ShopperAddressResponse>}
 */
export async function setDefaultAddress(addressId) {
  if (!addressId) throw new Error('setDefaultAddress requires an addressId');
  return parse(await joorchinFetch(`${BASE}/addresses/${addressId}/default`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({}),
  }));
}

// --- Address normalization (mirrors the server) ----------------------------
/**
 * These are the SAME rules the server applies in
 * be/core/src/modules/plugins/ecommerce/shopper-address.util.ts. They live
 * here so a form can show the error before a round trip — never so the browser
 * can decide what is valid. The server re-validates everything.
 * `address-helpers-parity.test.ts` in be/core runs both implementations over
 * the same inputs and fails if they ever disagree.
 * @param {unknown} input
 * @returns {string}
 */
export { toLatinDigits } from '../auth.js';

/** Canonical ASCII Iranian mobile in E.164 (`+989121234567`), else ''.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizePhone(raw) {
  return normalizeIranianMobile(raw) ?? '';
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isValidPhone(raw) {
  return normalizePhone(raw) !== '';
}

/**
 * `+989121234567` → `09121234567` for display beside a Persian address.
 * @param {unknown} value
 * @returns {string}
 */
export function localPhone(value) {
  return normalizeIranianMobile(value) ? formatIranianMobile(value) : "";
}

/**
 * Iranian postal code: 10 digits, kept as a string. '' when invalid.
 *
 * The first five digits are the routing half (کد رهسپاری) and Iran Post
 * never uses 0 or 2 there. MUST stay identical to the server's rule in
 * shopper-address.util.ts — a storefront that accepts what checkout rejects
 * strands the shopper on the payment step.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizePostalCode(raw) {
  if (raw == null) return '';
  const digits = toLatinDigits(String(raw)).replace(/[\s-]/g, '');
  return /^[13-9]{5}\d{5}$/.test(digits) ? digits : '';
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isValidPostalCode(raw) {
  return normalizePostalCode(raw) !== '';
}

/**
 * Does `city` belong to `province`? Pass the `provinces` array from
 * getShippingLocations() — never a browser-side copy of the dataset.
 * @param {Array<{name?:string,cities?:string[]}>} provinces
 * @param {string} province
 * @param {string} city
 * @returns {boolean}
 */
export function isCityOfProvince(provinces, province, city) {
  const key = (v) => String(v == null ? '' : v)
    .replace(/ي|ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const row = (provinces || []).find((p) => key(p && p.fa) === key(province));
  if (!row) return false;
  return (row.cities || []).some((c) => key(c) === key(city));
}

// --- Orders & checkout -----------------------------------------------------
/**
 * Where the gateway (or the server return bridge) sends the shopper back to:
 * the order-success route under the app base (the preview base in previews), or
 * `/miniapp` inside a Telegram Mini App.
 * @param {string=} orderId
 * @returns {string}
 */
export function shopReturnUrl(orderId) {
  const miniApp = typeof window !== 'undefined' && /(?:^|\/)miniapp(?:\/|$)/.test(window.location.pathname);
  const route = miniApp ? '/miniapp' : '/shop/order-success';
  return appUrl(route, { order: orderId });
}

// One in-flight request per key: a double click must not create two orders or
// two payment attempts. Cleared when the request settles so a retry works.
const inFlight = new Map();
function once(key, run) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = Promise.resolve().then(run).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

/**
 * @param {string} id
 * @returns {Promise<import('./ecommerce-contracts.js').OrderResponse>}
 */
export async function getOrder(id) {
  if (!id) throw new Error('getOrder requires an orderId');
  return parse(await joorchinFetch(`${BASE}/orders/${id}`, { headers: headers(false, { cart: true }) }));
}

/**
 * Create an order from the current server cart. The server snapshots live
 * prices, recomputes the total (incl. tax + shipping), and reserves stock.
 * Pass shippingMethodId to lock in shipping at checkout time.
 * Pass paymentMethod:'cod' for delivery settlement or 'cardtocard' for the
 * private receipt flow. Returns { orderId, total, currency, paymentUrl?, redirect? }.
 * For an online order the response already carries the gateway hand-off: call
 * redirectToPayment(order) — do NOT call startCheckout() right after it (that
 * would open a second payment attempt; startCheckout is only the retry path).
 * Concurrent identical calls share one request.
 * @param {Partial<import('./ecommerce-contracts.js').CheckoutBody>} [options]
 * @returns {Promise<import('./ecommerce-contracts.js').CheckoutResponse & {redirect?: import('../joorchin.js').PaymentRedirect, sandbox?: boolean}>}
 * @example
 * const order = await checkout({ addressId, shippingMethodId, paymentMethod: 'online' });
 * redirectToPayment(order); // GET or POST hand-off to the gateway
 */
export async function checkout({ address, customer, addressId, pickupLocationId, shippingMethodId, paymentMethod, callbackUrl } = {}) {
  return await once('checkout', async () => {
    const result = await parse(await joorchinFetch(`${BASE}/checkout`, {
      method: 'POST',
      headers: headers(true, { cart: true, surface: true }),
      body: JSON.stringify({
        address: address || {},
        customer: customer || {},
        ...(addressId ? { addressId } : {}),
        ...(pickupLocationId ? { pickupLocationId } : {}),
        ...(shippingMethodId ? { shippingMethodId } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        ...((callbackUrl || paymentMethod !== 'cod')
          ? { callbackUrl: callbackUrl || shopReturnUrl() }
          : {}),
      }),
    }));
    await trackMiniApp('checkout', result?.orderId);
    return result;
  });
}

/**
 * @returns {Promise<import('./ecommerce-contracts.js').CheckoutPaymentMethodsResponse>}
 */
export async function getCheckoutPaymentMethods() {
  return parse(await joorchinFetch(`${BASE}/checkout/payment-methods`, { headers: headers(false, { cart: true }) }));
}

/**
 * @param {string} authority
 * @returns {Promise<import('./ecommerce-contracts.js').ManualPaymentResponse>}
 */
export async function getManualPayment(authority) {
  if (!authority) throw new Error('getManualPayment requires an authority');
  return parse(await joorchinFetch(`${BASE}/manual-payments/${encodeURIComponent(authority)}`, { headers: headers(false, { cart: true }) }));
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خواندن فایل رسید ناموفق بود'));
    reader.onload = () => resolve(String(reader.result || '').split(',', 2)[1] || '');
    reader.readAsDataURL(file);
  });
}

/**
 * @param {string} authority
 * @param {File|Blob} file
 * @param {string=} trackingNumber
 * @returns {Promise<Record<string,unknown>>}
 */
export async function submitManualPaymentReceipt(authority, file, trackingNumber) {
  if (!file || file.size < 1 || file.size > 4 * 1024 * 1024) throw new Error('حجم رسید باید حداکثر ۴ مگابایت باشد');
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) throw new Error('نوع فایل رسید پشتیبانی نمی‌شود');
  return parse(await joorchinFetch(`${BASE}/manual-payments/${encodeURIComponent(authority)}/receipt`, {
    method: 'POST',
    headers: headers(true, { cart: true }),
    body: JSON.stringify({ mimeType: file.type, fileName: file.name, dataBase64: await fileBase64(file), ...(trackingNumber ? { trackingNumber } : {}) }),
  }));
}

/**
 * Live carrier tracking for an order: { trackingNumber, status, location, eta }.
 * @param {string} orderId
 * @returns {Promise<import('./ecommerce-contracts.js').TrackResponse>}
 */
export async function trackOrder(orderId) {
  if (!orderId) throw new Error('trackOrder requires an orderId');
  return parse(await joorchinFetch(`${BASE}/orders/${orderId}/track`, { headers: headers(false, { cart: true }) }));
}

/**
 * Retry payment for an already-created online order. Amount is derived
 * server-side. The response carries `paymentUrl` and, when the gateway needs a
 * form POST, `redirect`; pass it to redirectToPayment() (or set
 * `{ redirect: true }` to navigate automatically). A missing gateway fails
 * closed; only a server-confirmed zero-total order returns without a redirect.
 * Concurrent calls for one order share one request.
 * @param {string} orderId
 * @param {{redirect?: boolean}=} options
 * @returns {Promise<import('./ecommerce-contracts.js').PayResponse & {redirect?: import('../joorchin.js').PaymentRedirect, sandbox?: boolean}>}
 */
export async function startCheckout(orderId, { redirect = false } = {}) {
  if (!orderId) throw new Error('startCheckout requires an orderId');
  return await once(`pay:${orderId}`, async () => {
    // Return route resolved under the app base — a hand-typed absolute shop URL
    // sent preview shoppers to a 404 after the gateway redirect.
    const result = await parse(await joorchinFetch(`${BASE}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: headers(true, { surface: true }),
      body: JSON.stringify({ callbackUrl: shopReturnUrl(orderId) }),
    }));
    if (redirect || paymentRedirectOf(result)?.method === 'POST') redirectToPayment(result);
    return result;
  });
}

/**
 * Confirm an order after returning from the payment gateway. The server
 * verifies the gateway callback and only then marks the order paid — the
 * browser cannot set order status itself. Pass the raw return query (string,
 * URLSearchParams or object): Authority/Status, Zibal trackId/success, SEP
 * RefNum/State, Mellat SaleReferenceId/ResCode are all located and forwarded.
 * `outcome` is present on newer servers; older ones only send `paid`.
 * @param {string} orderId
 * @param {string|URLSearchParams|{authority?:string,status?:string,[key:string]:unknown}=} returned
 * @returns {Promise<import('./ecommerce-contracts.js').ConfirmResponse & {outcome?: import('../joorchin.js').PaymentOutcome}>}
 */
export async function confirmOrder(orderId, returned = {}) {
  if (!orderId) throw new Error('confirmOrder requires an orderId');
  const { authority, status, params } = normalizeGatewayReturn(returned);
  return parse(await joorchinFetch(`${BASE}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ ...params, authority, status }),
  }));
}

const PAID_ORDER = new Set(['paid', 'processing', 'shipped', 'delivered', 'completed', 'fulfilled']);

/**
 * Map a confirm response or order row to an outcome. Tolerates old servers
 * that only send `paid`/`status`.
 * @param {Record<string,unknown>|null|undefined} value
 * @returns {import('../joorchin.js').PaymentOutcome}
 */
export function orderOutcome(value) {
  const explicit = asPaymentOutcome(value?.outcome);
  if (explicit) return explicit;
  const status = String(value?.paymentStatus ?? value?.status ?? '').toLowerCase();
  if (value?.paid === true || PAID_ORDER.has(status)) return 'paid';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'failed' || status === 'expired' || status === 'refunded') return 'failed';
  return 'pending';
}

const POLL_MS = 3000;
const POLL_MAX = 20;

/**
 * Drives the order result page. Reads the gateway/bridge query once, confirms
 * with the server at most once per return (StrictMode-safe), polls the order
 * while verification is pending, and exposes one of
 * 'checking' | 'paid' | 'pending' | 'cancelled' | 'failed'.
 * `retry()` opens a fresh payment attempt (online orders only).
 * @param {{orderId?: string, search?: string}} [options] Defaults: query string of the current URL.
 * @returns {{state: 'checking'|'paid'|'pending'|'cancelled'|'failed', orderId?: string, order: Record<string,unknown>|null, message: string, sandbox: boolean, retry: () => Promise<void>, refresh: () => void}}
 */
export function useOrderPaymentResult(options = {}) {
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const ret = normalizeGatewayReturn(search);
  const orderId = options.orderId || ret.orderId;
  const confirmation = useRef(null);
  const attempts = useRef(0);
  const returnKey = `${orderId}|${search}`;
  const previousReturn = useRef(returnKey);
  if (previousReturn.current !== returnKey) {
    previousReturn.current = returnKey;
    attempts.current = 0;
    confirmation.current = null;
  }
  const query = useQuery({
    queryKey: shopKey('payment-result', getAuthHeaders(), orderId, search),
    enabled: Boolean(orderId),
    retry: false,
    queryFn: async () => {
      let verdict;
      let message = '';
      if (ret.hasGatewayParams) {
        const key = `${orderId}|${search}`;
        if (confirmation.current?.key !== key) {
          confirmation.current = { key, promise: confirmOrder(orderId, search).then(
            (value) => ({ verdict: orderOutcome(value), message: '' }),
            (error) => ({ verdict: error?.code === 'PAYMENT_PROVIDER_PENDING' || error?.code === 'PAYMENT_VERIFY_IN_PROGRESS' ? 'pending' : 'failed', message: error?.message || 'تأیید پرداخت ناموفق بود.' }),
          ) };
        }
        const result = await confirmation.current.promise;
        verdict = result.verdict;
        message = result.message;
      }
      const order = await getOrder(orderId);
      attempts.current++;
      const actual = orderOutcome(order);
      // A query-string outcome is a hint. Only the authenticated order read
      // can establish a paid result; expired paid orders require merchant review.
      const state = actual === 'paid' ? 'paid' : order.latePayment ? 'failed' : actual === 'pending' ? (verdict === 'paid' ? 'pending' : verdict) || (ret.outcome === 'cancelled' || ret.outcome === 'failed' ? ret.outcome : 'pending') : actual;
      return { order, state, message };
    },
    refetchInterval: (q) => q.state.data?.state === 'pending' && POLL_MAX > attempts.current ? POLL_MS : false,
  });
  const retry = useCallback(async () => {
    if (!orderId || query.data?.order?.status !== 'pending') return;
    await startCheckout(orderId, { redirect: true });
  }, [orderId, query.data?.order?.status]);
  const refresh = useCallback(() => { attempts.current = 0; void query.refetch(); }, [query.refetch]);
  const state = !orderId || query.isError ? 'failed' : query.data?.state || 'checking';
  return { state, orderId, order: query.data?.order || null, message: query.error?.message || query.data?.message || '', sandbox: /^sandbox-|^S0/i.test(ret.authority || ''), retry, refresh };
}

/**
 * Telegram Mini App: the gateway runs in the external browser, so re-read the
 * order whenever the app returns to the foreground. Returns an unsubscribe.
 * @param {string} orderId
 * @param {(order: Record<string,unknown>) => void} onChange
 * @returns {() => void}
 */
export function watchOrderPayment(orderId, onChange) {
  if (!orderId || typeof document === 'undefined') return () => {};
  const refresh = () => { if (document.visibilityState !== 'hidden') void getOrder(orderId).then(onChange, () => undefined); };
  document.addEventListener('visibilitychange', refresh);
  const app = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  app?.onEvent?.('activated', refresh);
  return () => {
    document.removeEventListener('visibilitychange', refresh);
    app?.offEvent?.('activated', refresh);
  };
}

/**
 * @param {Record<string,unknown>=} params
 * @returns {Promise<import('./ecommerce-contracts.js').OrdersResponse>}
 */
export async function listOrders(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.fulfillmentStatus) qs.set('fulfillmentStatus', params.fulfillmentStatus);
  if (params.q) qs.set('q', params.q);
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.skip != null) qs.set('skip', String(params.skip));
  if (params.envelope) qs.set('envelope', '1');
  return asRowList(await parse(await joorchinFetch(`${BASE}/orders?${qs.toString()}`, { headers: headers(false, { cart: true }) })));
}

export { APP_ID };

// --- Data hooks (react-query) ---------------------------------------------
// Pages use these instead of useEffect + useState. Keys sit under the
// ecommerce plugin prefix, so `usePluginMutation('ecommerce', ...)` refreshes
// them. The cart is NOT a query: it stays in `useCart()` (server-owned totals).
const STALE_MS = 30_000;
const shopKey = (...parts) => [...queryKeys.plugin(PLUGIN_ID), ...parts];

/** @typedef {{enabled?: boolean}} ShopHookOptions */
/** @template T @typedef {{data: T|undefined, error: Error|null, isLoading: boolean, isPending: boolean, isError: boolean, isFetching: boolean, isSuccess: boolean, refetch: Function}} ShopQuery */

/**
 * Active products. @param {{filter?:Record<string,unknown>,sort?:string,limit?:number,skip?:number}} [params]
 * @param {ShopHookOptions} [options]
 * @returns {ShopQuery<Array<import('../plugin-models.js').EcommerceProductRow>>}
 */
export function useProducts(params = {}, options = {}) {
  return useQuery({
    queryKey: shopKey('products', params),
    queryFn: () => listProducts(params),
    staleTime: STALE_MS,
    enabled: options.enabled ?? true,
  });
}

/**
 * One product with `attributeList`. Disabled until `id` is set.
 * @param {string|undefined} id @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('../plugin-models.js').EcommerceProductRow & {attributeList: Array<{key: string, label: string, value: unknown}>}>}
 */
export function useProduct(id, options = {}) {
  return useQuery({
    queryKey: shopKey('product', id),
    queryFn: () => getProduct(id),
    staleTime: STALE_MS,
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/**
 * Faceted product search; the previous result stays visible while a filter changes.
 * @param {Omit<Partial<import('./ecommerce-contracts.js').ProductSearchQuery>, 'tags'> & {tags?:string|string[],attributes?:Record<string,string|string[]>}} [params] @param {ShopHookOptions} [options]
 * @returns {ShopQuery<Array<import('../plugin-models.js').EcommerceProductRow> & {total?: number, facets?: unknown}>}
 */
export function useProductSearch(params = {}, options = {}) {
  return useQuery({
    queryKey: shopKey('search', params),
    queryFn: () => searchProducts(params),
    staleTime: STALE_MS,
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  });
}

/** Catalog categories ordered by `order`.
 * @param {Record<string,unknown>} [params] @param {ShopHookOptions} [options]
 * @returns {ShopQuery<Array<import('../plugin-models.js').EcommerceCategoryRow>>}
 */
export function useCategories(params = {}, options = {}) {
  return useQuery({
    queryKey: shopKey('categories', params),
    queryFn: () => listCategories(params),
    staleTime: STALE_MS,
    enabled: options.enabled ?? true,
  });
}

/** One category. Disabled until `id` is set.
 * @param {string|undefined} id @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('../plugin-models.js').EcommerceCategoryRow>}
 */
export function useCategory(id, options = {}) {
  return useQuery({
    queryKey: shopKey('category', id),
    queryFn: () => getCategory(id),
    staleTime: STALE_MS,
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Settings, delivery choices, pickup points and cold facets in one request.
 * @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('./ecommerce-contracts.js').StorefrontResponse>}
 */
export function useStorefront(options = {}) {
  return useQuery({
    queryKey: shopKey('storefront'),
    queryFn: () => getStorefront(),
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  });
}

/** The signed-in customer's orders.
 * @param {Record<string,unknown>} [params] @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('./ecommerce-contracts.js').OrdersResponse>}
 */
export function useOrders(params = {}, options = {}) {
  return useQuery({
    queryKey: shopKey('orders', getAuthHeaders(), params),
    queryFn: () => listOrders(params),
    enabled: options.enabled ?? true,
  });
}

/** One order of the signed-in customer. Disabled until `id` is set.
 * @param {string|undefined} id @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('./ecommerce-contracts.js').OrderResponse>}
 */
export function useOrder(id, options = {}) {
  return useQuery({
    queryKey: shopKey('order', getAuthHeaders(), id),
    queryFn: () => getOrder(id),
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** The signed-in customer's saved addresses.
 * @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('./ecommerce-contracts.js').ShopperAddressListResponse>}
 */
export function useAddresses(options = {}) {
  return useQuery({ queryKey: shopKey('addresses', getAuthHeaders()), queryFn: listAddresses,
    enabled: options.enabled ?? true });
}

/** Backend-owned province/city catalog.
 * @returns {ShopQuery<import('./ecommerce-contracts.js').ShippingLocationsResponse>}
 */
export function useShippingLocations() {
  return useQuery({ queryKey: shopKey('shipping-locations'), queryFn: getShippingLocations, staleTime: STALE_MS });
}

/** Same-session or signed-in owned tracking; this is not cross-session recovery.
 * @param {string} id @param {ShopHookOptions} [options]
 * @returns {ShopQuery<import('./ecommerce-contracts.js').TrackResponse>}
 */
export function useOrderTracking(id, options = {}) {
  return useQuery({ queryKey: shopKey('tracking', getAuthHeaders(), id), queryFn: () => trackOrder(id),
    enabled: (options.enabled ?? true) && Boolean(id) });
}

/** Authoritative checkout-mode notice. @returns {ShopQuery<import('./ecommerce-contracts.js').CheckoutPaymentMethodsResponse>} */
export function useCheckoutPaymentMethods() {
  return useQuery({ queryKey: shopKey('checkout-payment-methods', getAuthHeaders()), queryFn: getCheckoutPaymentMethods });
}
