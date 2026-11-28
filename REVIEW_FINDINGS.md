# JERKA — Review Findings

Full code review of the storefront (`main` @ `b5946c5`). Findings are grouped by severity. File references point at the current `src/` tree. No code has been changed yet; these are the work items for the fix phase.

Status legend: `open` = not started.

---

## Critical — breaks purchases or shows false information

| # | Finding | Where | Status |
|---|---|---|---|
| C1 | **Payment return URL points to a 404.** The gateway return URL is hard-coded to `/shop/order-success`. The real route is `/shop/ordersuccess`, so shoppers may land on "page not found" after paying online. `SHOP_ROUTES` in the same file has the wrong paths too. Confirm end-to-end with one sandbox payment. | `src/api/plugins/ecommerce.js` ~L34, ~L606–608 (used ~L660, ~L740) | open |
| C2 | **Fabricated ratings.** Every product card without a real rating shows "(۱۵) ۴٫۳ ★". This breaks the project's own design rule and is a consumer-trust and legal risk. | `src/components/ProductCard.jsx` ~L197–201 | open |
| C3 | **Selected variant is ignored.** Size and color buttons on the product page are never sent to the cart. `handleAdd` calls `add(productId, qty)`, and the provider's `add` has no variant parameter. Products with variants may add the base product or fail silently. | `src/pages/Shop/ProductDetail/[id].jsx` ~L564; `src/platform/providers/cart-provider.jsx`; `src/components/ProductCard.jsx` ~L117 | open |
| C4 | **Cart edits target the wrong line.** The server identifies cart lines by `lineId`, but Cart, CartDrawer, and the provider use `productId` for update and remove. Lines that differ only by variant can collide. React keys also use `productId`. | `cart-provider.jsx` ~L68–73; `src/pages/Shop/Cart.jsx` ~L89, ~L256, ~L297, ~L324, ~L336; `src/components/CartDrawer.jsx` ~L130, ~L167–202; `Checkout.jsx` ~L251 | open |
| C5 | **Checkout province and city are free text.** The server requires the city to belong to the province, and the client helpers that enforce this (`isCityOfProvince`, `isValidPhone`, `isValidPostalCode`) are never used. Typos will be rejected at payment. | `src/pages/Shop/Checkout.jsx` ~L20–21 | open |
| C6 | **Pickup has no location.** Pickup locations are fetched and then discarded. A pickup method can be selected, but no location is ever sent. | `src/pages/Shop/Checkout.jsx` ~L61 | open |
| C7 | **Fake newsletter.** The footer shows "عضویت شما با موفقیت ثبت شد" but nothing is sent anywhere. | `src/components/Layout.jsx` ~L202 | open |
| C8 | **Dead footer and menu links.** "تماس", "ارسال", "بازگشت کالا", "پرسش‌های رایج", and "حریم خصوصی" all go to the shop page, so there are no real help or policy pages. | `src/components/Layout.jsx` ~L225–234 | open |

## High — broken navigation and wrong content

| # | Finding | Where | Status |
|---|---|---|---|
| H1 | **Hero button and gift-edit cards 404.** They link to `/shop`, which is not a route (the catalog is `/shop/productlist`). | `src/pages/home.content.js` L23, L126, L133; `src/pages/Home.jsx` ~L282, ~L363 | open |
| H2 | **Mobile "داستان ژرکا" 404s.** The mobile menu rewrites `/#story` to `/story`, which is not a route. | `src/components/Layout.jsx` ~L177 | open |
| H3 | **Category links match nothing.** The footer and mega-menu use slugs like `?category=living`, but the catalog filters by real category IDs. These links show empty results. The `CATEGORY_IMAGES` map in the catalog is slug-keyed too. | `Layout.jsx` ~L213–216; `src/pages/Shop/ProductList.jsx` ~L75, ~L400–405 | open |
| H4 | **Home category tiles can be fake.** When server categories have no images, the tiles fall back to hard-coded categories with fake IDs, so their links lead nowhere useful. | `src/pages/Home.jsx` ~L216; `home.content.js` `categories.fallbacks` | open |
| H5 | **Duplicate home sections.** "Trending" and "New arrivals" run the identical query (`sort: -created_at`, limit 8). | `src/pages/Home.jsx` ~L384, ~L498 | open |
| H6 | **Invented data on cards.** Products with no category show "نشیمن" (living). Titles containing "چوب" or "صندلی" get made-up color swatches. | `src/components/ProductCard.jsx` ~L109 and the swatch logic | open |
| H7 | **Conflicting promises.** The product page says free shipping above 1 million تومان; the home banner says above 5 million (`home.content.js` L13). Seven-day returns and 24–48 hour dispatch are hard-coded. Confirm with the business owner which are true. | `ProductDetail/[id].jsx` ~L850; `home.content.js` L13; `Cart.jsx` ~L395; `CartDrawer.jsx` ~L253 | open |
| H8 | **Possible currency mislabel.** Cards hard-code "تومان" and ignore `product.currency`, while cart and checkout print "ریال" for IRR. This could show a 10× misreading. Confirm the server currency first. | `src/components/ProductCard.jsx` ~L249–257; `src/lib/money.js` | open |
| H9 | **Silent add-to-cart failures.** Errors only reach `console.error` on the product page and on the card. Shoppers get no message. | `ProductDetail/[id].jsx` ~L569; `ProductCard.jsx` ~L122 | open |
| H10 | **Wrong imagery and third-party hot-linking.** The fallback catalog includes headphones, a powerbank, and a mouse pad for a home-décor store. Several fallbacks hot-link Unsplash. | `src/lib/product-media.js`; `Cart.jsx` ~L276; `CartDrawer.jsx` ~L146 | open |
| H11 | **No quantity cap.** The product stepper has no stock limit, and the out-of-stock check uses the product's stock rather than the selected variant's. | `ProductDetail/[id].jsx` ~L503–540, ~L777–800 | open |
| H12 | **Shipping can go stale.** Shipping is re-priced only when the method changes, not when the address changes. | `src/pages/Shop/Checkout.jsx` ~L68–71 | open |

## Medium — SEO, PWA, and tooling

| # | Finding | Where | Status |
|---|---|---|---|
| M1 | **PWA identity is placeholder.** The installed app is named "My Site" (short name "Site", description "Built with Joorchin"). Theme color is `#99002e` and background is `#ffffff`, which breaks the no-pure-white rule. | `src/config/pwa.js` L10–17; generated `manifest.webmanifest` | open |
| M2 | **Sitemap is invalid.** Its `<loc>` values are relative, and it lists only the home page. | `public/sitemap.xml` | open |
| M3 | **No per-page SEO.** `SeoHead` is never used, so every route shares one title and description. Product pages have no product metadata. The `og:image` fallback file does not exist. | `index.html`; `src/seo/SeoHead.jsx` (unused) | open |
| M4 | **Service worker over-caches.** All ~1.4 MB of fonts in `public/fonts` are precached, including families the CSS may not use. | `vite.config.js` (workbox `globPatterns`); `src/index.css` | open |
| M5 | **Private dependency blocks outside installs.** `@joorchin/site-ui` is hosted on a private GitLab registry, and `.npmrc` needs an `NPM_TOKEN`. `Checkout.jsx` and `OrderSuccess.jsx` depend on it. | `package.json`; `.npmrc`; `Checkout.jsx` L1; `OrderSuccess.jsx` L5 | open |
| M6 | **`.env` is committed.** `.gitignore` does not exclude it. Values look non-secret, but environment config belongs outside git. | `.env`; `.gitignore` | open |
| M7 | **Docs do not match the repo.** The README references `todos/…`, `src/theme.css`, and `src/sections/`, none of which exist. `design.md` says `/shop/products`, but the real route is `/shop/productlist`. The README's `cd jerka` path is wrong. | `README.md`; `design.md` | open |
| M8 | **Mobile overlays may collide.** The Joorchin badge and install banner stack bottom-left, and the Enamad seal sits bottom-right. The seal is mounted twice, once in the footer and once in `App.jsx`. | `main.jsx`; `App.jsx`; `Layout.jsx` L342; `JoorchinBuiltBy.jsx`; `PwaInstallBanner.jsx` | open |
| M9 | **Checkout ignores payment choice.** Payment modes are fetched, but the only use is the sandbox badge. COD and card-to-card cannot be selected. | `Checkout.jsx` ~L29, ~L128 | open |
| M10 | **Lint warnings.** Seven unused-variable warnings (`Home.jsx`, `ProductList.jsx`, `ProductDetail/[id].jsx`, `ProductSlider.jsx`). | `pnpm lint` | open |

## Low — design-rule drift and accessibility

| # | Finding | Where | Status |
|---|---|---|---|
| L1 | **Design rules broken across the codebase.** About 42 `transition-all`, 8 `tracking-tight` on Persian headings (the rule says zero), and about 22 pure-white uses. | `src/**/*.jsx` | open |
| L2 | **Accessibility gaps.** The cart drawer has no focus trap or focus return. Clearing the cart uses a native `window.confirm`. About 14 `outline-none` uses need matching focus styles. | `CartDrawer.jsx`; `Cart.jsx`; multiple | open |
| L3 | **Small copy and tokens.** The hero location reads "تهران · تهران". Playfair Display is Latin-only, so Persian digits in `font-display` fall back to a system serif. | `home.content.js` L31; `index.css` `--font-display` | open |
| L4 | **Unused cart-page item key.** Recommendations are keyed on `p.id`, while the rest of the code uses `_id || id`. | `src/pages/Shop/Cart.jsx` ~L317 area | open |
| L5 | **GTM / Clarity IDs are interpolated into inline scripts.** Low risk, because the owner sets them, but it should be escaped. | `src/seo/StorefrontHead.jsx` | open |

---

## Added in the SDK review

These come from reviewing `@joorchin/client-sdk` (details in `SDK_REVIEW.md`). They affect the migration to the SDK.

| # | Finding | Where | Status |
|---|---|---|---|
| S1 | **Published SDK crashes on import.** `dist/sdk.js` imports `js-tiktoken/lite` and `js-tiktoken/ranks/o200k_base`, but `js-tiktoken` is not declared in the package's dependencies. A clean install fails with `ERR_MODULE_NOT_FOUND`. (Verified with a clean `npm install`.) | SDK `package.json` | open — report to the SDK owners |
| S2 | **SDK bundle is very heavy.** A minimal `createClient` import bundles to about 3.0 MB minified (about 1.35 MB gzipped). Most of that is tokenizer data used only by agent features. Aliasing the tokenizer to a stub brings it to about 202 KB gzipped. (Measured with esbuild.) | SDK dist | open — mitigate in the build |
| S3 | **Default server URL differs from the project's.** The SDK defaults to `https://api.joorchin.ai`, while `.env` uses `https://api.joorchin.site`. Pass `serverUrl` explicitly. Confirm which backend is production. | `sdk.d.ts` `DEFAULT_SERVER_URL`; `.env` | open — needs a decision |
| S4 | **Bundled ecommerce schemas are a different, legacy shape.** `schemas.Ecommerce*` uses numeric `productId`, `quantity`, `orderCode`, and has no `lineId` or `variantId`. It does not match the live plugin (string IDs, `qty`, `lineId`, `variantId`). Do not use these schemas for validation. | SDK `dist/types/contracts/schemas/ecommerce.d.ts` | open |
| S5 | **No typed storefront cart, checkout, or order API.** Visitors get typed plugin record reads, auth, profile, asset URLs, and push. Cart, checkout, orders, and addresses must go through the untyped `action(path)` call. | SDK `site-api.d.ts` | open — wrap in a typed JERKA layer |
| S6 | **Visitor plugin records are read-only.** Writes exist only on the staff `backoffice` side. | SDK `site-api.d.ts` | open — by design |
| S7 | **Error messages are not localized.** The SDK surfaces the server's message, or axios's English text such as "Request failed with status code 502" for gateway errors. The Persian mapping must be applied on top. | SDK `createAxiosClient` error path | open |
| S8 | **Token storage key is shared by default.** Browser sessions default to the localStorage key `joorchin_access_token`. Set a per-app `tokenStorageKey`. Tokens are JavaScript-readable, so XSS protection matters. | SDK `createClient`; `createBearerSession` | open |
| S9 | **Browser calls use credentials.** The SDK sets `withCredentials` in browsers. Use a same-origin relative `serverUrl: ''` with the existing dev and nginx proxy, which avoids CORS. (Verified: the URL builds as `/api/v1/...`.) | SDK `createClient` | open |
| S10 | **SDK license obligations.** Joorchin SDK License 1.0 permits use in Joorchin-integrated apps. Redistributed bundles must include the license file and copyright notices. | SDK `LICENSE.md` | open — add notice when bundling |
| S11 | **Source of the SDK.** The Google Drive link could not be fetched from this environment. The review used the public npm release `@joorchin/client-sdk@0.3.1`. Confirm it is the same build you intend to hand over. | — | open — needs confirmation |
