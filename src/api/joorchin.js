/**
 * Joorchin platform API helpers for generated apps.
 * APP_ID is injected at build/dev time via VITE_APP_ID (set from the preview container).
 */

import { getAuthHeaders } from "./auth.js";

/** @template T @typedef {T[] & {items:T[],data:T[],results:T[],rows:T[],records:T[],list:T[],total:number} & Record<string,any>} RowList */
/** @typedef {{filter?:Record<string,unknown>,sort?:string,limit?:number,skip?:number,envelope?:boolean}} EntityListOptions */

/** @type {string} */
const APP_ID = import.meta.env.VITE_APP_ID;

if (!APP_ID) {
  console.warn(
    "[joorchin] VITE_APP_ID is not set — entity API calls will fail",
  );
}

/** Base URL for an entity collection, e.g. `/api/v1/apps/{appId}/entities/todo`.
 * @param {string} entity
 * @param {string=} id
 * @returns {string}
 */
export function entitiesUrl(entity, id) {
  if (typeof entity !== "string" || !entity) {
    throw new Error(
      `[joorchin] entity name must be a non-empty string, got ${JSON.stringify(entity)}. ` +
        'Call listEntities("Task", { filter }) — the entity name is the first argument.',
    );
  }
  const base = `/api/v1/apps/${APP_ID}/entities/${encodeURIComponent(entity)}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

/**
 * The entity helpers below take the entity name positionally. Generated code
 * sometimes calls them options-style instead — `listEntities({ entity: 'Task' })`
 * — which used to stringify the object into the URL and 404. Accept both shapes
 * so either convention works.
 */
function normalizeEntityArgs(entity, rest) {
  // Drop undefined keys so positional args left off the call don't clobber the
  // same keys already present on an options-style first argument.
  const defined = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined),
  );
  if (entity && typeof entity === "object") {
    const name =
      entity.entity ?? entity.entityName ?? entity.model ?? entity.name;
    return { ...entity, ...defined, entity: name };
  }
  return { entity, ...defined };
}

function fetchOptions() {
  return {
    headers: {
      ...getAuthHeaders(),
    },
  };
}

/**
 * Minimal dependency-free toast — surfaces actionable backend errors (e.g. a
 * plugin that isn't installed for this app) to the site owner instead of failing
 * silently. No toast library is bundled in generated apps, so this injects a
 * self-contained, auto-dismissing element. De-duplicates by message so a page
 * that fires many failing requests doesn't stack identical toasts.
 */
const _shownToasts = new Set();
function showJoorchinToast(message, kind = "error") {
  if (typeof document === "undefined") return; // SSR / non-browser guard
  if (_shownToasts.has(message)) return;
  _shownToasts.add(message);
  setTimeout(() => _shownToasts.delete(message), 6000);

  const el = document.createElement("div");
  el.textContent = message;
  el.setAttribute("role", "alert");
  el.dir = "rtl";
  el.style.cssText = [
    "position:fixed",
    "top:16px",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:2147483647",
    "max-width:90vw",
    "padding:12px 18px",
    "border-radius:10px",
    "font:500 14px/1.5 system-ui,sans-serif",
    "color:#fff",
    "box-shadow:0 8px 24px rgba(0,0,0,.18)",
    `background:${kind === "error" ? "#dc2626" : "#16a34a"}`,
  ].join(";");
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5500);
}

/* ----------------------------------------------------------------------------
 * Error boundary — ONE place turns a failed request into a displayable error.
 *
 * App 6ab4d99a3f89e4693e72bfb4 rendered nginx's raw
 * `<html><head><title>502 Bad Gateway</title>…nginx</html>` inside the catalog
 * because every page renders `error.message` and the transport used the raw
 * response body as the message. The message is now ALWAYS short Persian copy
 * or a server-authored JSON `message`; the raw status/body travels on
 * non-displayed properties (`status`, `code`, `diagnostic`, `retryable`) and a
 * console.warn for debugging. Never put a response body in `error.message`.
 * ------------------------------------------------------------------------- */
export const JOORCHIN_ERROR_COPY = Object.freeze({
  network: "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.",
  unavailable:
    "سرویس موقتاً در دسترس نیست. لطفاً چند لحظه دیگر دوباره تلاش کنید.",
  unauthorized: "برای ادامه وارد حساب کاربری خود شوید.",
  forbidden: "اجازه دسترسی به این بخش را ندارید.",
  notFound: "مورد درخواستی پیدا نشد.",
  invalid: "اطلاعات ارسال‌شده معتبر نیست. لطفاً آن را بررسی کنید.",
  rateLimited: "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.",
  generic: "درخواست انجام نشد. لطفاً دوباره تلاش کنید.",
});

const GATEWAY_STATUSES = new Set([502, 503, 504]);
const DIAGNOSTIC_LIMIT = 2000;

/** Copy in effect: the Persian defaults, plus anything set by `setJoorchinErrorCopy`. */
let activeErrorCopy = { ...JOORCHIN_ERROR_COPY };

/**
 * Replace the user-facing error messages, e.g. for an English site:
 * `setJoorchinErrorCopy({ network: 'Could not reach the server.', generic: 'Something went wrong.' })`.
 * Only the keys of `JOORCHIN_ERROR_COPY` are accepted and only string values;
 * unknown keys are ignored. Call once at startup; pass `{}` to reset to the defaults.
 * @param {Partial<Record<keyof typeof JOORCHIN_ERROR_COPY, string>>} overrides
 * @returns {void}
 */
export function setJoorchinErrorCopy(overrides = {}) {
  const next = { ...JOORCHIN_ERROR_COPY };
  for (const key of Object.keys(JOORCHIN_ERROR_COPY)) {
    const value = overrides?.[key];
    if (typeof value === "string" && value.trim()) next[key] = value.trim();
  }
  activeErrorCopy = next;
}

function fallbackCopy(status) {
  if (GATEWAY_STATUSES.has(status) || status >= 500) {
    return activeErrorCopy.unavailable;
  }
  if (status === 401) return activeErrorCopy.unauthorized;
  if (status === 403) return activeErrorCopy.forbidden;
  if (status === 404) return activeErrorCopy.notFound;
  if (status === 429) return activeErrorCopy.rateLimited;
  if (status === 400 || status === 422) return activeErrorCopy.invalid;
  return activeErrorCopy.generic;
}

/** A server message is displayable only if it is plain short text, not markup. */
function displayableMessage(value) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text || text.length > 300 || /<[a-z!/][^>]*>/i.test(text)) return "";
  return text;
}

/** Parse an error body into `{ message, code, details }` — JSON only. */
function readStructuredError(text) {
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    return null; // HTML gateway page, plain text proxy error, truncated body
  }
  if (!payload || typeof payload !== "object") return null;
  const inner =
    payload.error && typeof payload.error === "object" ? payload.error : null;
  return {
    message: displayableMessage(
      inner?.message ??
        (typeof payload.error === "string" ? payload.error : undefined) ??
        payload.message,
    ),
    code: inner?.code ?? payload.code,
    details: inner?.details ?? payload.details ?? payload.issues,
  };
}

/**
 * Build the Error every platform/plugin client throws for a failed request.
 * `message` is safe to render; `status`, `code`, `details`, `diagnostic` and
 * `retryable` are for branching (401 → login, 422 → field errors) and logs.
 * @param {number} status
 * @param {string=} text
 * @param {Record<string,unknown>=} extra
 */
export function createJoorchinError(status, text = "", extra = {}) {
  const structured = readStructuredError(text);
  const gateway = GATEWAY_STATUSES.has(status);
  // A gateway failure's body is the proxy's, never the app server's message.
  const message =
    (!gateway && structured?.message) || fallbackCopy(Number(status) || 0);
  const error = new Error(message);
  error.name = "JoorchinApiError";
  error.status = status;
  error.code =
    structured?.code ?? (gateway ? "service_unavailable" : undefined);
  if (structured?.details !== undefined) error.details = structured.details;
  error.retryable = gateway || status >= 500 || status === 429;
  error.diagnostic = String(text || "").slice(0, DIAGNOSTIC_LIMIT);
  Object.assign(error, extra);
  if (!structured && text) {
    console.warn(
      `[joorchin] request failed with status ${status} and a non-JSON body`,
      error.diagnostic.slice(0, 300),
    );
  }
  return error;
}

/**
 * Network failure (offline, DNS, CORS, reset) → the same displayable shape.
 * @param {unknown} cause
 */
export function createJoorchinNetworkError(cause) {
  const error = new Error(activeErrorCopy.network);
  error.name = "JoorchinApiError";
  error.status = 0;
  error.code = "network_error";
  error.retryable = true;
  error.diagnostic = String(cause?.message || cause || "");
  error.cause = cause;
  console.warn("[joorchin] network request failed", error.diagnostic);
  return error;
}

const CLIENT_HEADER = "X-Joorchin-Client";

/** Read the identity of the SDK making the call, not the scaffold version.
 * @param {"site-sdk" | "backoffice-sdk"} [name]
 * @returns {string | null}
 */
export function sdkClientIdentity(name = "site-sdk") {
  try {
    const files = import.meta.glob("../platform/runtime-identity.json", {
      eager: true,
      import: "default",
    });
    const identity = Object.values(files)[0];
    const version = identity?.[
      name === "backoffice-sdk" ? "backofficeSdkVersion" : "siteSdkVersion"
    ];
    return typeof version === "string" && /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(version)
      ? `${name}@${version}`
      : null;
  } catch {
    return null; // Identity unavailable outside the delivered app build.
  }
}

/** @param {RequestInit=} init */
function withClientHeader(init) {
  const identity = sdkClientIdentity();
  if (!identity) return init;
  const headers = new Headers(init?.headers);
  if (!headers.has(CLIENT_HEADER)) headers.set(CLIENT_HEADER, identity);
  return { ...init, headers };
}

/**
 * `fetch` with the network failure mapped to Persian copy. Aborts are
 * rethrown untouched so callers can still ignore their own cancellations.
 * @param {string} url
 * @param {RequestInit=} init
 */
export async function joorchinFetch(url, init) {
  try {
    return await globalThis.fetch(url, withClientHeader(init));
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    throw createJoorchinNetworkError(cause);
  }
}

function toastOwnerActionableError(status, text) {
  const message = readStructuredError(text)?.message || "";
  // Plugin-not-installed is an owner-actionable misconfiguration, not a code
  // bug — show a clear toast instead of a silent failure / blank section.
  if (status === 403 && /not installed/i.test(message)) {
    const plugin = message.match(/'([^']+)'/)?.[1];
    showJoorchinToast(
      plugin
        ? `افزونه «${plugin}» برای این سایت نصب نشده است. از بخش افزونه‌ها آن را نصب کنید.`
        : "این افزونه برای سایت نصب نشده است. از بخش افزونه‌ها آن را نصب کنید.",
    );
  }
}

/**
 * Inspect a failed response body and surface owner-actionable backend errors as
 * a toast (today: plugin-not-installed). Returns a DISPLAYABLE message string
 * (never the raw body). Kept for clients that build their own Error; prefer
 * `createJoorchinError` / `parseJoorchinResponse`, which also keep `status`.
 * @param {number} status
 * @param {string} text
 */
export function surfaceJoorchinError(status, text) {
  return joorchinResponseError(status, text).message;
}

/**
 * The one call every client makes for a non-OK response:
 * `throw joorchinResponseError(response.status, await response.text())`.
 * Toasts owner-actionable errors, then returns the displayable Error.
 * @param {number} status
 * @param {string} text
 */
export function joorchinResponseError(status, text) {
  toastOwnerActionableError(status, text);
  return createJoorchinError(status, text);
}

/**
 * Shared response parser for the platform client AND every plugin client.
 * Failed responses throw `createJoorchinError`; a 2xx whose body is not JSON
 * (an SPA/proxy HTML page served for an API path) throws the unavailable copy
 * instead of `Unexpected token '<'`.
 * @param {Response} response
 * @returns {Promise<unknown>}
 */
export async function parseJoorchinResponse(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // Callers branch on `status` (e.g. booking flow: 401 → prompt login).
    throw joorchinResponseError(response.status, text);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw createJoorchinError(502, text, {
      status: response.status,
      code: "invalid_response",
      retryable: true,
    });
  }
}

const parseResponse = parseJoorchinResponse;

/* ----------------------------------------------------------------------------
 * List responses — ONE shape, both access patterns.
 *
 * App 6aabacf4c2bd915f1afd3b47 shipped an entirely empty storefront because
 * every generated page read `rows?.items || []` while `listPluginRecords`
 * resolved to a *bare array*. Nothing caught it: the requests returned 200,
 * typecheck and lint were clean, and the pages rendered their own empty
 * states. The guess was reasonable — `searchProducts` in the very same
 * ecommerce client returns `{ items, total }`, so the seam taught two
 * contradictory shapes.
 *
 * `asRowList` removes the choice. Every list helper resolves to a real Array
 * (so `.map` / `.length` / `for..of` / spread work) that ALSO answers to
 * `.items`, `.data`, `.results`, `.rows` and `.total` via non-enumerable
 * self-aliases. Envelopes coming back from the server are unwrapped to the
 * same thing. Whichever shape a caller assumes, it now reads the real rows.
 * ------------------------------------------------------------------------- */
const LIST_ALIASES = ["items", "data", "results", "rows", "records", "list"];

/** @typedef {Record<string, unknown> | Array<Record<string, unknown>>} ApiResult JSON from a plugin route: an object, or a list of objects. */
/** @typedef {import('./plugin-models.js').PluginRowMap} PluginRowMap */
/** @template {string} P @template {string} E @typedef {P extends keyof PluginRowMap ? (E extends keyof PluginRowMap[P] ? PluginRowMap[P][E] : Record<string,unknown>) : Record<string,unknown>} PluginRow */
/** @typedef {{_id?: string, id?: string, created_at?: string, updated_at?: string}} EntityMeta */

/** @template T @param {T[] | {items?:T[],data?:T[],results?:T[],rows?:T[],total?:number} | Record<string,unknown> | null | undefined | number | string} value
 * @param {number=} total
 * @returns {RowList<T>}
 */
export function asRowList(value, total) {
  let rows = value;
  let count = total;
  let extras = null;
  if (!Array.isArray(rows) && rows && typeof rows === "object") {
    const key = LIST_ALIASES.find((name) => Array.isArray(rows[name]));
    if (typeof rows.total === "number") count = rows.total;
    // Envelopes carry siblings worth keeping (searchProducts → facets).
    extras = rows;
    rows = key ? rows[key] : [];
  }
  if (!Array.isArray(rows)) rows = [];
  const hide = (name, descriptor) => {
    if (name === "length" || Object.prototype.hasOwnProperty.call(rows, name))
      return;
    Object.defineProperty(rows, name, {
      ...descriptor,
      enumerable: false,
      configurable: true,
    });
  };
  for (const name of LIST_ALIASES) {
    hide(name, {
      get() {
        return this;
      },
    });
  }
  if (extras) {
    for (const [name, sibling] of Object.entries(extras)) {
      if (LIST_ALIASES.includes(name)) continue;
      hide(name, { value: sibling, writable: true });
    }
  }
  hide("total", {
    value: typeof count === "number" ? count : rows.length,
    writable: true,
  });
  return rows;
}

/**
 * List rows of an entity collection. Pass a row type for typed fields:
 * `listEntities<{ title: string }>('todo')`.
 * @template {Record<string,unknown>} [T=Record<string,unknown>]
 * @param {string | (EntityListOptions & {entity:string})} entity
 * @param {EntityListOptions} [params]
 * @returns {Promise<RowList<T>>} an Array — the rows. Also readable as `.items` / `.data` /
 *   `.results` / `.rows`, with `.total` — see `asRowList`.
 * @example
 * const todos = await listEntities('todo', { filter: { done: false }, sort: '-created_at', limit: 20 });
 * todos.total; // unpaged count
 */
export async function listEntities(entity, params = {}) {
  const args = normalizeEntityArgs(entity, params);
  const search = new URLSearchParams();
  if (args.filter) search.set("filter", JSON.stringify(args.filter));
  if (args.sort) search.set("sort", args.sort);
  if (args.limit != null) search.set("limit", String(args.limit));
  if (args.skip != null) search.set("skip", String(args.skip));
  if (args.envelope) search.set("envelope", "1");
  const qs = search.toString();
  const url = entitiesUrl(args.entity) + (qs ? `?${qs}` : "");
  return asRowList(await parseResponse(await joorchinFetch(url, fetchOptions())));
}

/** @template {Record<string,unknown>} [T=Record<string,unknown>]
 * @param {string} entity @param {string} id
 * @returns {Promise<T & EntityMeta>}
 */
export async function getEntity(entity, id) {
  const args = normalizeEntityArgs(entity, { id });
  return parseResponse(
    await joorchinFetch(entitiesUrl(args.entity, args.id), fetchOptions()),
  );
}

/** @template {Record<string,unknown>} [T=Record<string,unknown>]
 * @param {string} entity @param {Partial<T>} data
 * @returns {Promise<T & EntityMeta>}
 */
export async function createEntity(entity, data) {
  const args = normalizeEntityArgs(entity, { data });
  return parseResponse(
    await joorchinFetch(entitiesUrl(args.entity), {
      ...fetchOptions(),
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(args.data),
    }),
  );
}

/** @template {Record<string,unknown>} [T=Record<string,unknown>]
 * @param {string} entity @param {string} id @param {Partial<T>} data
 * @returns {Promise<T & EntityMeta>}
 */
export async function updateEntity(entity, id, data) {
  const args = normalizeEntityArgs(entity, { id, data });
  return parseResponse(
    await joorchinFetch(entitiesUrl(args.entity, args.id), {
      ...fetchOptions(),
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(args.data),
    }),
  );
}

/** @param {string} entity @param {string} id
 * @returns {Promise<unknown>}
 */
export async function deleteEntity(entity, id) {
  const args = normalizeEntityArgs(entity, { id });
  return parseResponse(
    await joorchinFetch(entitiesUrl(args.entity, args.id), {
      ...fetchOptions(),
      method: "DELETE",
    }),
  );
}

/* ----------------------------------------------------------------------------
 * Plugin data API — multi-tenant CRUD over a plugin's shared collections.
 * Distinct from entities: plugin rows live in shared collections (booking,
 * product, …) scoped by app id on the server. Always go through these helpers;
 * never hardcode the URL.
 * @param {string} pluginId
 * ------------------------------------------------------------------------- */
export function pluginDataUrl(pluginId, entity, id) {
  const base = `/api/v1/apps/${APP_ID}/plugins/${pluginId}/data/${entity}`;
  return id ? `${base}/${id}` : base;
}

/**
 * List rows of a plugin collection (product, category, order, post, …). Row
 * fields are typed for known plugin entities (`PluginRowMap`).
 * @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {EntityListOptions} [params]
 * @returns {Promise<RowList<PluginRow<P, E>>>} an Array — the rows. Also readable as `.items` / `.data` /
 *   `.results` / `.rows`, with `.total` — see `asRowList`.
 */
export async function listPluginRecords(pluginId, entity, params = {}) {
  const search = new URLSearchParams();
  if (params.filter) search.set("filter", JSON.stringify(params.filter));
  if (params.sort) search.set("sort", params.sort);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.skip != null) search.set("skip", String(params.skip));
  if (params.envelope) search.set("envelope", "1");
  const qs = search.toString();
  const url = pluginDataUrl(pluginId, entity) + (qs ? `?${qs}` : "");
  return asRowList(await parseResponse(await joorchinFetch(url, fetchOptions())));
}

/** One plugin row; the type follows `PluginRowMap` for known plugin entities.
 * @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {string} id
 * @returns {Promise<PluginRow<P, E> & EntityMeta>}
 */
export async function getPluginRecord(pluginId, entity, id) {
  return parseResponse(
    await joorchinFetch(pluginDataUrl(pluginId, entity, id), fetchOptions()),
  );
}

/** @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {Partial<PluginRow<P, E>>} data
 * @returns {Promise<PluginRow<P, E> & EntityMeta>}
 */
export async function createPluginRecord(pluginId, entity, data) {
  return parseResponse(
    await joorchinFetch(pluginDataUrl(pluginId, entity), {
      ...fetchOptions(),
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    }),
  );
}

/** @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {string} id @param {Partial<PluginRow<P, E>>} data
 * @returns {Promise<PluginRow<P, E> & EntityMeta>}
 */
export async function updatePluginRecord(pluginId, entity, id, data) {
  return parseResponse(
    await joorchinFetch(pluginDataUrl(pluginId, entity, id), {
      ...fetchOptions(),
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    }),
  );
}

/** @param {string} pluginId @param {string} entity @param {string} id
 * @returns {Promise<unknown>}
 */
export async function deletePluginRecord(pluginId, entity, id) {
  return parseResponse(
    await joorchinFetch(pluginDataUrl(pluginId, entity, id), {
      ...fetchOptions(),
      method: "DELETE",
    }),
  );
}

/**
 * Authenticated app-scoped request for semantic plugin routes not covered by CRUD helpers.
 * @param {string} path
 * @param {RequestInit=} init
 * @returns {Promise<ApiResult>}
 */
export async function requestAppApi(path, init = {}) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return parseResponse(
    await joorchinFetch(`/api/v1/apps/${APP_ID}/${cleanPath}`, {
      ...init,
      headers: { ...getAuthHeaders(), ...(init.headers || {}) },
    }),
  );
}

/**
 * POST to a plugin endpoint that the backend deliberately exposes without site
 * authentication (for example the Forms contact-message endpoint). URL
 * construction stays in this platform seam so generated plugin clients never
 * guess or hardcode the app-scoped REST path.
 * @param {string} pluginId
 * @param {string} action
 * @param {Record<string,unknown>} data
 * @returns {Promise<ApiResult>}
 */
export async function postPublicPluginAction(pluginId, action, data) {
  if (typeof pluginId !== "string" || !pluginId.trim()) {
    throw new Error("[joorchin] plugin id must be a non-empty string");
  }
  if (typeof action !== "string" || !action.trim()) {
    throw new Error("[joorchin] plugin action must be a non-empty string");
  }
  const path = action
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const url = `/api/v1/apps/${APP_ID}/plugins/${encodeURIComponent(pluginId)}/${path}`;
  return parseResponse(
    await joorchinFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

/**
 * GET a plugin-owned action through the platform transport seam. `action` may
 * be empty for a plugin's root endpoint (for example server-side search).
 * @param {string} pluginId
 * @param {string=} action
 * @param {Record<string,unknown>=} query
 * @returns {Promise<ApiResult>}
 */
export async function getPluginAction(pluginId, action = "", query = {}) {
  // limit, skip, sort and envelope travel through the same query passthrough.
  return requestPluginAction(pluginId, action, { query });
}

/**
 * General authenticated plugin action transport for generated plugin clients.
 * URL construction, tenant scoping, auth and error handling stay platform-owned.
 * @param {string} pluginId
 * @param {string=} action
 * @param {{method?:string,query?:Record<string,unknown>,data?:unknown,headers?:Record<string,string>}=} options
 * @returns {Promise<ApiResult>}
 * @example
 * const summary = await requestPluginAction('reviews', 'summary', { query: { targetId } });
 * await requestPluginAction('reviews', 'reviews', { method: 'POST', data: { targetId, rating: 5 } });
 */
export async function requestPluginAction(
  pluginId,
  action = "",
  { method = "GET", query = {}, data, headers = {} } = {},
) {
  if (typeof pluginId !== "string" || !pluginId.trim()) {
    throw new Error("[joorchin] plugin id must be a non-empty string");
  }
  if (typeof action !== "string") {
    throw new Error("[joorchin] plugin action must be a string");
  }
  const path = action
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
    } else {
      search.set(key, String(value));
    }
  }
  const suffix = path ? `/${path}` : "";
  const qs = search.toString();
  const url = `/api/v1/apps/${APP_ID}/plugins/${encodeURIComponent(pluginId)}${suffix}${qs ? `?${qs}` : ""}`;
  return parseResponse(
    await joorchinFetch(url, {
      method,
      headers: {
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeaders(),
        ...headers,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  );
}

/**
 * POST to one of this app's configured integration endpoints.
 * @param {string} packageName
 * @param {string} endpoint
 * @param {Record<string,unknown>} data
 * @returns {Promise<ApiResult>}
 */
export async function postIntegrationAction(packageName, endpoint, data) {
  if (typeof packageName !== "string" || !packageName.trim()) {
    throw new Error(
      "[joorchin] integration package must be a non-empty string",
    );
  }
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw new Error(
      "[joorchin] integration endpoint must be a non-empty string",
    );
  }
  const url = `/api/v1/apps/${APP_ID}/integration-endpoints/${encodeURIComponent(packageName)}/${encodeURIComponent(endpoint)}`;
  return parseResponse(
    await joorchinFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    }),
  );
}

/* ----------------------------------------------------------------------------
 * Public storefront config — owner-set trust seals + tracking IDs (eNamad,
 * GTM, Clarity, Google verification, custom <head>). Unauthenticated by design:
 * the server returns ONLY fields the owner flagged public. Used by StorefrontHead.
 * ------------------------------------------------------------------------- */
/**
 * Deduped per plugin id for the page's lifetime. Two components read this config
 * (StorefrontHead and EnamadSeal) and React StrictMode double-invokes each
 * effect, so the naive version issued the SAME request four times within ~30ms
 * on every preview open. The values are owner-set config that cannot change
 * while the page is open, so one request per plugin is the correct number.
 */
const publicSettingsCache = new Map();

/**
 * @param {string=} pluginId
 * @returns {Promise<Record<string,unknown>>}
 */
export function getPublicSettings(pluginId = "ecommerce") {
  const cached = publicSettingsCache.get(pluginId);
  if (cached) return cached;

  const url = `/api/v1/apps/${APP_ID}/plugins/${pluginId}/setup/public`;
  const request = (async () => {
    try {
      return await parseResponse(await joorchinFetch(url));
    } catch {
      // Evict so a transient failure does not poison the page: the next mount
      // (or a later navigation) retries instead of caching `{}` forever.
      publicSettingsCache.delete(pluginId);
      return {};
    }
  })();

  publicSettingsCache.set(pluginId, request);
  return request;
}

let publicSiteSettingsRequest;

/**
 * App-wide tracking, ownership-verification, and custom head settings.
 * @returns {Promise<Record<string,unknown>>}
 */
export function getPublicSiteSettings() {
  if (publicSiteSettingsRequest) return publicSiteSettingsRequest;

  const url = `/api/v1/apps/${APP_ID}/site-settings/public`;
  publicSiteSettingsRequest = (async () => {
    try {
      return await parseResponse(await joorchinFetch(url));
    } catch {
      publicSiteSettingsRequest = undefined;
      return {};
    }
  })();
  return publicSiteSettingsRequest;
}

/**
 * Record a visitor event for the owner's analytics, e.g.
 * `track('signup_click', { plan: 'pro', seats: 3 })`. Fire-and-forget: it never
 * throws, never blocks, and is a no-op where the telemetry beacon is not
 * installed (SSR, tests). The name is normalised to lower_snake_case; props keep
 * at most 10 keys of string, number or boolean values. Do not put personal data
 * (phone, email, name) in props.
 * @param {string} name
 * @param {Record<string, string | number | boolean>} [props]
 * @returns {void}
 */
export function track(name, props) {
  try {
    const clean = String(name ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.:-]+/g, "_")
      .replace(/^[^a-z]+/, "")
      .slice(0, 64);
    if (!clean) return;
    const beacon = typeof window !== "undefined" ? window.__joorchinTrack : null;
    if (typeof beacon === "function") beacon(clean, props);
  } catch {
    /* analytics must never break the page */
  }
}

// <payment-return>
// Shared by the ecommerce plugin, the payments plugin and the Mini App. Pure
// functions only (no React, no fetch) so one test pins them all.

/** @typedef {'paid'|'pending'|'cancelled'|'failed'} PaymentOutcome */
/** @typedef {{method:'GET'|'POST',url:string,fields?:Record<string,string>}} PaymentRedirect Gateway hand-off. POST must be a form submit (SEP/Mellat/Parsian/Sadad style). */
/** @typedef {{paymentUrl?:string,checkoutUrl?:string,redirect?:PaymentRedirect,sandbox?:boolean,demo?:boolean}} PaymentStartResult */

const PAYMENT_OUTCOMES = ["paid", "pending", "cancelled", "failed"];

/**
 * Narrow an untrusted value (response field or query param) to an outcome.
 * @param {unknown} value
 * @returns {PaymentOutcome|undefined}
 */
export function asPaymentOutcome(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return PAYMENT_OUTCOMES.includes(v) ? /** @type {PaymentOutcome} */ (v) : undefined;
}

/**
 * Vite's resolved base without a trailing slash: the mount path in a preview
 * container, `''` on a published root domain.
 * @returns {string}
 */
export function appBasePath() {
  const raw = String(import.meta.env?.BASE_URL ?? "").trim();
  if (!raw || raw === "/" || raw === "./") return "";
  const path = raw.startsWith("/") ? raw : `/${raw.replace(/^\.\//, "")}`;
  return path.replace(/\/+$/, "");
}

/**
 * Absolute URL of an app route that keeps the preview the preview base base.
 * A hand-built absolute shop URL 404s in previews.
 * @param {string} path Route such as `/shop/order-success`.
 * @param {Record<string,string|undefined>=} query
 * @returns {string}
 */
export function appUrl(path, query) {
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const route = `/${String(path || "").replace(/^\/+/, "")}`;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) if (value) qs.set(key, value);
  const tail = qs.toString();
  return `${origin}${appBasePath()}${route === "/" ? "" : route}${tail ? `?${tail}` : ""}`;
}

const AUTHORITY_KEYS = ["authority", "Authority", "SaleReferenceId", "saleReferenceId", "trackId", "trans_id", "transId", "id", "RefNum", "refNum", "Token", "token", "RefId", "refId", "refid"];
const STATUS_KEYS = ["status", "Status", "state", "State"];
const ORDER_KEYS = ["orderId", "order", "order_id", "orderid", "clientRefId", "ResNum", "SaleOrderId", "OrderId"];
// Everything a gateway may append; forwarded verbatim so the server decides.
const GATEWAY_KEYS = new Set([...AUTHORITY_KEYS, ...STATUS_KEYS, ...ORDER_KEYS, "success", "code", "ResCode", "payment_status", "outcome"]);

/**
 * THE one place gateway return parameters are interpreted: Zarinpal
 * `Authority`/`Status`, Zibal `trackId`/`success`/`status`, SEP `RefNum`/`State`,
 * Mellat `SaleReferenceId`/`ResCode`, plus the server return bridge's
 * `outcome` and `orderId`. The server still verifies; this only locates values.
 * @param {string|URLSearchParams|Record<string,unknown>|null|undefined} input A query string, URLSearchParams or plain object.
 * @returns {{orderId?:string,authority?:string,status?:string,outcome?:PaymentOutcome,params:Record<string,string>,hasGatewayParams:boolean}}
 */
export function normalizeGatewayReturn(input) {
  /** @type {Record<string,string>} */
  const all = {};
  if (typeof input === "string") {
    for (const [k, v] of new URLSearchParams(input.replace(/^[?#]/, ""))) all[k] = v;
  } else if (input && typeof input.forEach === "function" && typeof input.get === "function") {
    input.forEach((v, k) => { all[k] = String(v); });
  } else if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input)) if (v != null && typeof v !== "object") all[k] = String(v);
  }
  const first = (keys) => { for (const k of keys) if (all[k]) return all[k]; return undefined; };
  /** @type {Record<string,string>} */
  const params = {};
  for (const k of Object.keys(all)) if (GATEWAY_KEYS.has(k) && k !== "outcome") params[k] = all[k];
  const authority = first(AUTHORITY_KEYS);
  const status = first(STATUS_KEYS);
  const outcome = asPaymentOutcome(all.outcome);
  const gatewayEvidence = Boolean(authority || status || all.success !== undefined || all.code !== undefined || all.ResCode !== undefined || all.payment_status !== undefined);
  return { orderId: first(ORDER_KEYS), authority, status, outcome, params, hasGatewayParams: gatewayEvidence };
}

/**
 * Read the redirect instruction off a create-payment / checkout / pay
 * response. Old responses carry only `paymentUrl`/`checkoutUrl` (GET).
 * @param {PaymentStartResult|null|undefined} result
 * @returns {PaymentRedirect|null}
 */
export function paymentRedirectOf(result) {
  if (!result || typeof result !== "object") return null;
  const r = result.redirect;
  if (r && typeof r === "object" && typeof r.url === "string" && r.url) {
    return { method: String(r.method).toUpperCase() === "POST" ? "POST" : "GET", url: r.url, ...(r.fields ? { fields: r.fields } : {}) };
  }
  const url = result.paymentUrl || result.checkoutUrl;
  return url ? { method: "GET", url } : null;
}

/**
 * True for a sandbox/demo payment, so previews can say "test payment".
 * @param {PaymentStartResult|null|undefined} result
 * @returns {boolean}
 */
export function isSandboxPayment(result) {
  if (!result || typeof result !== "object") return false;
  if (result.sandbox === true || result.demo === true) return true;
  const url = paymentRedirectOf(result)?.url || "";
  return /(?:^|[/.])sandbox[.-]|\/sandbox(?:[/?]|$)/i.test(url);
}

/**
 * Send the shopper to the gateway. GET navigates; POST builds and submits a
 * form (fields are bank-issued tokens). Inside a Telegram Mini App a GET opens
 * through `openLink` so the gateway runs in the external browser.
 * @param {PaymentStartResult|null|undefined} result
 * @returns {boolean} true when a navigation was started.
 */
export function redirectToPayment(result) {
  const redirect = paymentRedirectOf(result);
  if (!redirect || typeof window === "undefined") return false;
  if (!/^https?:\/\//i.test(redirect.url)) throw new Error("Invalid payment redirect URL");
  if (redirect.method === "POST") {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = redirect.url;
    form.style.display = "none";
    for (const [name, value] of Object.entries(redirect.fields || {})) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    return true;
  }
  const telegram = window.Telegram?.WebApp;
  if (telegram?.initData && typeof telegram.openLink === "function" && /^https?:\/\//i.test(redirect.url)) {
    telegram.openLink(redirect.url, { try_instant_view: false });
    return true;
  }
  window.location.assign(redirect.url);
  return true;
}
// </payment-return>

export { APP_ID };
