# `@joorchin/client-sdk` — Review for JERKA

Reviewed version: **0.3.1** (npm, public tarball, 109 files, 1.5 MB unpacked). Review method: read the README, `package.json`, type definitions, and the `dist/sdk.js` runtime. Then installed the package into a clean project, ran it against a local mock server to record the exact HTTP requests, and bundled it with esbuild to measure size.

**Not verified:** the Google Drive copy that you mentioned could not be downloaded from this sandbox, so this review covers the npm 0.3.1 build. Confirm it matches the copy you plan to hand over.

---

## 1. What the SDK provides

Entry: `createClient({ appId, serverUrl, token, refreshToken, tokenStorageKey, … })`. Other exports: `createClientFromRequest`, `schemas`, `JoorchinError`, `DEFAULT_SERVER_URL`, `resolveServerUrl`. A separate `@joorchin/client-sdk/websocket-client` entry exists.

| Module | Use for JERKA? | Notes |
|---|---|---|
| `client.site.plugin(id).records(entity)` | **Yes** — products, categories, pickup locations, payment modes | Read-only for visitors. `list`/`get` map to `/apps/:appId/plugins/:id/data/:entity`. |
| `client.site.plugin(id).action(path, opts)` | **Yes** — cart, checkout, orders, addresses | Generic. Accepts `method`, `body`, `query`, `headers`. No typed cart or checkout methods exist. |
| `client.auth` (customer) | **Yes** — login, OTP, register, profile, logout | Also `setSession`, `getSession`, `refreshSession`, `forgotPassword`, `resetPassword`. |
| `client.assets(id, query)` | **Yes** — image URLs with width and format | Builds `${serverUrl}/api/v1/apps/:appId/assets/:assetId`. |
| `client.site.push` | Only if push notifications are wanted | Needs a BYF app and server VAPID setup. |
| `client.backoffice`, staff auth | **No** — staff/admin only | Writes and orders management. Not for a public storefront. |
| `client.agents`, `platform`, `bookings`, `appLogs` | **No** | Platform-builder and other features. |
| `client.entities`, `client.functions` | Not needed | Not used by JERKA's current design. |

### Auth and session
- Customer tokens are stored in `localStorage` (readable by JavaScript). Use a unique per-app `tokenStorageKey`.
- A 401 triggers one refresh and a retry. A 403 does not refresh.

---

## 2. Verified behavior (mock server, exact requests)

| Call | Request sent |
|---|---|
| `site.plugin('ecommerce').records('product').list({ filter, sort, limit, skip })` | `GET /api/v1/apps/<id>/plugins/ecommerce/data/product?filter=…&sort=…&limit=…&skip=…` — **same URL that JERKA's `listPluginRecords` builds** |
| `…action('cart', { headers: {'x-cart-session': s} })` | `GET …/plugins/ecommerce/cart` with the custom header sent |
| `…action('cart/items', { method:'POST', body, headers })` | `POST …/plugins/ecommerce/cart/items` with body and header |
| `…action('checkout', { method:'POST', … })` | `POST …/plugins/ecommerce/checkout` |
| `createClient({ serverUrl: '' })` | Builds same-origin `/api/v1/...` URLs. Works with the Vite and nginx proxy. |
| Default (no `serverUrl`) | `https://api.joorchin.ai` |
| `assets('abc', { width: 600, format: 'webp' })` | `…/api/v1/apps/<id>/assets/abc?width=600&format=webp` |

Error handling: a 422 produces `JoorchinError` with `status` 422, `message` from the server (`"variantId is required"`), and `data` set to the raw body. A 502 HTML page produces a `JoorchinError` with the English message `"Request failed with status code 502"`, so the Persian error text must be applied on top.

Conclusion: the SDK can replace JERKA's hand-written `joorchin.js` fetch layer without changing what the server receives, provided the calls go through `action()` for cart and checkout.

---

## 3. Defects and risks found

1. **Import crash on clean install (blocker).** `dist/sdk.js` imports `js-tiktoken/lite` and `js-tiktoken/ranks/o200k_base`, but `js-tiktoken` is not in the package's dependencies. `import '@joorchin/client-sdk'` fails with `ERR_MODULE_NOT_FOUND`. I worked around it by installing `js-tiktoken` manually. This must be reported to the SDK owners, and the fix should land before handover.
2. **Heavy bundle.** Minified, the SDK is about 3.0 MB (about 1.35 MB gzipped) for a bare `createClient`. Aliasing the tokenizer to a stub brings it to about 202 KB gzipped. The tokenizer appears to belong to agent features that a storefront never uses. JERKA's build should alias it out, or the SDK should split it into a separate entry.
3. **Legacy ecommerce schemas.** `schemas.Ecommerce*` uses numeric IDs, `quantity`, and `orderCode`, with no `lineId` or `variantId`. The live plugin uses string IDs, `qty`, `lineId`, and `variantId`. Do not use these schemas to validate storefront data.
4. **No typed visitor cart/checkout/order API.** Everything goes through `action(path)`, which is untyped. JERKA needs its own typed wrapper, and the endpoint paths should be confirmed with the Joorchin backend team.
5. **Default server is different.** The SDK defaults to `https://api.joorchin.ai`. The project's `.env` uses `https://api.joorchin.site`. Confirm which is production, and set `serverUrl` explicitly either way.
6. **Errors are not localized.** Gateway failures show English axios text. Map them to Persian in the JERKA layer.
7. **Shared token key by default.** Set a unique `tokenStorageKey` for JERKA.
8. **Platform ownership.** The SDK README says generated sites use `@/api/*` files and `@joorchin/site-ui`. JERKA's architecture uses platform-owned `src/api/joorchin.js` and JERKA-owned plugin files. Integration must respect those ownership boundaries.
9. **License.** Joorchin SDK License 1.0 permits use only in apps that integrate with Joorchin. Keep the license and copyright notices in any redistributed bundle.

---

## 4. Integration plan (not started — awaiting your go-ahead)

1. Confirm: the SDK version (npm 0.3.1 vs the Drive copy), the production server URL, and the JERKA ownership rules for `src/api/joorchin.js`.
2. Report defect #1 to the SDK owners. Until it is fixed, pin a local `js-tiktoken` install or use an alias.
3. Create a `createClient({ appId, serverUrl: '' or the confirmed URL, tokenStorageKey: 'jerka_…' })` singleton.
4. Replace the catalog reads (`listPluginRecords`) with `client.site.plugin('ecommerce').records(...)`.
5. Move cart and checkout to typed wrappers over `action()`, with `x-cart-session` and the line-based `lineId`/`variantId` shapes from the live plugin. Fixes C3 and C4 in `REVIEW_FINDINGS.md`.
6. Route all errors through a Persian mapper (defect #6).
7. Alias the tokenizer in `vite.config.js` (defect #2), and check the bundle size afterwards.
8. Validate against the live backend with a sandbox order before the payment return route (C1) is closed.

Items 1 and 2 need your answer before any code changes.
