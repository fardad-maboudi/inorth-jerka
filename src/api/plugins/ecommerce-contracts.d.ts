// Generated from be/core/src/modules/plugins/ecommerce/ecommerce.contract.ts.
export type AddCartItemBody = {
  productId: string;
  variantId?: string;
  qty: number;
  sessionId?: string;
};
export type UpdateCartItemBody = {
  qty: number;
  sessionId?: string;
  [key: string]: unknown;
};
export type CouponBody = {
  code: string;
  sessionId?: string;
  [key: string]: unknown;
};
export type SetShippingBody = {
  methodId: string;
  address: { [key: string]: unknown };
  addressId?: string;
  pickupLocationId?: string;
  sessionId?: string;
  [key: string]: unknown;
};
export type ShopperAddressBody = {
  label?: string;
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  line1?: string;
  building?: string;
  unit?: string;
  postalCode?: string;
  isDefault?: boolean;
  [key: string]: unknown;
};
export type CheckoutBody = {
  address: { [key: string]: unknown };
  customer: { [key: string]: unknown };
  addressId?: string;
  pickupLocationId?: string;
  shippingMethodId?: string;
  paymentMethod?: "online" | "cod" | "cardtocard";
  callbackUrl?: string;
  sessionId?: string;
  [key: string]: unknown;
};
export type PayBody = { callbackUrl: string; [key: string]: unknown };
export type ConfirmBody = {
  authority: string;
  status?: string;
  [key: string]: unknown;
};
export type ProductSearchQuery = {
  q?: string;
  categoryId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  inStock?: "true" | "false";
  sort?: unknown;
  limit?: number;
  skip?: number;
  facets?: "true" | "false";
  [key: string]: unknown;
};
export type FacetsQuery = {
  categoryId?: string;
  category?: string;
  [key: string]: unknown;
};
export type OrderListQuery = {
  limit: number;
  skip: number;
  sort: unknown;
  status?: string;
  fulfillmentStatus?: string;
  q?: string;
  [key: string]: unknown;
};
export type CartResponse = {
  id: string;
  items: Array<{
    lineId: string;
    variantId?: string;
    sku?: string;
    attributes?: { [key: string]: string | number | boolean };
    maxQty: number;
    productId: string;
    title: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    image?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
  currency: string;
  couponCode?: string;
  shipping?: {
    methodId: string;
    name?: string;
    carrier?: string;
    service?: string;
    cost: number;
    etaDays?: number;
    demo?: boolean;
  };
};
export type ProductSearchResponse = {
  items: Array<{ [key: string]: unknown }>;
  total: number;
  facets?: Array<{
    key: string;
    label: string;
    values: Array<{ value: string; count: number }>;
  }>;
};
export type FacetsResponse = Array<{
  key: string;
  label: string;
  values: Array<{ value: string; count: number }>;
}>;
export type StoreSettingsResponse = {
  storeName?: string;
  currency?: string;
  taxRate?: number;
  taxIncluded?: boolean;
  contactEmail?: string;
  contactPhone?: string;
} | null;
export type ShopperAddressResponse = {
  id: string;
  label?: string;
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  line1?: string;
  building?: string;
  unit?: string;
  postalCode?: string;
  isDefault: boolean;
};
export type ShopperAddressListResponse = Array<{
  id: string;
  label?: string;
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  line1?: string;
  building?: string;
  unit?: string;
  postalCode?: string;
  isDefault: boolean;
}>;
export type CheckoutResponse = {
  orderId: string;
  total: number;
  currency: string;
  paymentUrl?: string;
  redirect?: {
    method: "GET" | "POST";
    url: string;
    fields?: { [key: string]: string };
  };
};
export type CheckoutPaymentMethodsResponse = {
  online: boolean;
  sandbox?: boolean;
  cod: boolean;
  cardtocard: boolean;
};
export type ManualPaymentResponse = {
  authority: string;
  appId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  destination: { cardNumber: string; cardHolder: string };
  receipt?: {
    mimeType: string;
    fileName: string;
    size: number;
    trackingNumber?: string;
    submittedAt: unknown;
  };
};
export type PayResponse = {
  orderId: string;
  paymentUrl?: string;
  redirect?: {
    method: "GET" | "POST";
    url: string;
    fields?: { [key: string]: string };
  };
  demo?: boolean;
};
export type ConfirmResponse = {
  orderId: string;
  status: string;
  paid: boolean;
  outcome: "paid" | "pending" | "cancelled" | "failed";
};
export type TrackResponse = {
  trackingNumber?: string;
  status: string;
  location?: string;
  eta?: string;
  demo?: boolean;
};
export type OrderResponse = { [key: string]: unknown };
export type ShippingMethodsResponse = Array<{ [key: string]: unknown }>;
export type ShippingLocationsResponse = {
  provinces: Array<{ fa: string; cities: Array<string> }>;
};
export type PickupLocationsResponse = Array<{ [key: string]: unknown }>;
export type StorefrontResponse = {
  settings: {
    storeName?: string;
    currency?: string;
    taxRate?: number;
    taxIncluded?: boolean;
    contactEmail?: string;
    contactPhone?: string;
  } | null;
  shippingMethods: Array<{ [key: string]: unknown }>;
  pickupLocations: Array<{ [key: string]: unknown }>;
  facets: Array<{
    key: string;
    label: string;
    values: Array<{ value: string; count: number }>;
  }>;
};
export type OrdersResponse = Array<{ [key: string]: unknown }>;
