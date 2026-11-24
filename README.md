# JERKA — ژرکا

A standalone, hand-crafted luxury ecommerce storefront built on the Joorchin
generated-site stack. JERKA is a **fork of the platform template
(`be/vps/generated-site/`) that is deliberately outside the platform sync
loop**: it owns its files, its design system, and its tooling. Nothing under
`be/vps` knows about it, and nothing Joorchin-owned is duplicated or modified.

## What it is

| | |
|---|---|
| Stack | React 19 · Vite 7 · Tailwind v4 · react-router-dom 7 · TanStack Query · framer-motion |
| Direction | Editorial luxury — warm ivory paper, espresso ink, burnished copper; Estedad headings, Vazirmatn body, Playfair Display Latin accents |
| Language | Persian-first, RTL (`<html lang="fa" dir="rtl">`), server-currency prices (IRR/تومان) |
| Backend | Any Joorchin app with the **ecommerce plugin** installed — products, cart, coupons, shipping, checkout and orders are all server-owned |

## Run it

```bash
cd jerka
pnpm install

# 1) point it at a Joorchin app that has the ecommerce plugin + products
cp .env.example .env          # set VITE_APP_ID=<your app id>

# 2) be-core must be reachable; the dev server proxies same-origin /api to it
#    (default http://localhost:15000 — override with JOORCHIN_CORE_URL)
pnpm dev
```

Production build: `pnpm build` (PWA service worker included). Lint: `pnpm lint`.

### How the backend connection works

- All calls are **same-origin relative** (`/api/v1/apps/<VITE_APP_ID>/…`).
  In dev, `vite.config.js` proxies `/api` to be-core; in preview containers and
  on published sites nginx/ingress does the same — no API base URL env var.
- `src/api/joorchin.js` — platform helper (entity + plugin-data CRUD, Persian
  toast for owner-actionable errors like plugin-not-installed).
- `src/api/plugins/ecommerce.js` — JERKA's copy of the platform scaffold's
  ecommerce client: catalog search/facets, server-owned cart (`x-cart-session`
  guest sessions), coupons, delivery methods, checkout → payment → confirm,
  order tracking. **The browser never computes money** — the server reprices
  everything.
- `src/config/plugins.js` enables the platform `CartProvider` via the plugins
  manifest; `src/lib/cart-context.js` provides `useCart()`.

## Ownership boundary (read before editing)

JERKA started as a copy of `be/vps/generated-site/` and was then **cut loose**:

- **JERKA owns:** everything under `src/pages/**`, `src/components/**` (Layout,
  CartDrawer, ProductCard, ProductGrid, Reveal), `src/theme.css` design tokens
  (appended to `src/index.css` after the template's default `@theme` — same
  merge mechanism as the platform's per-app `set_theme`), `src/api/plugins/`,
  `src/lib/{routes,money,motion}.js`, `src/hooks/`, `package.json`,
  `eslint.config.js`, `vite.config.js` additions.
- **Platform-owned (do not restructure):** `src/App.jsx` (the
  `@joorchin-platform-entry` self-wiring router), `src/api/joorchin.js`,
  `src/api/auth.js`, `src/lib/{cart,i18n}-*`, `src/platform/providers/**`,
  `src/pwa/**`, `src/seo/**`, `public/*.js` runtime scripts, `vite-plugin/`.
  These are pinned by upstream contract tests in `be/vps`; jerka tolerates
  their lint shape via scoped eslint overrides instead of editing them.
- **Never registered back:** no path under `be/vps` references `jerka/`, so
  `syncPlatformOwnedFiles` / preview provisioning can never heal or overwrite
  anything here — and jerka can never break the platform template.

## Routes

Derived from the `src/pages/**` filenames by `src/lib/page-routes.js` —
never hardcode a path literal (use `src/lib/routes.js`):

| File | URL |
|---|---|
| `pages/Home.jsx` | `/` |
| `pages/Shop/ProductList.jsx` | `/shop/productlist` |
| `pages/Shop/ProductDetail/[id].jsx` | `/shop/productdetail/:id` |
| `pages/Shop/Cart.jsx` | `/shop/cart` |
| `pages/Shop/Checkout.jsx` | `/shop/checkout` |
| `pages/Shop/OrderSuccess.jsx` | `/shop/ordersuccess` |

## Notes

- `todos/JERKA_STANDALONE_ECOMMERCE_SITE_TODO.md` is the plan this
  implementation followed (guardrails, phases, done-when criteria).
- The design system lives in `src/index.css` (search for "JERKA design
  system"): brand/neutral ramps, paper/espresso/line surfaces, `btn-primary`,
  `btn-outline`, `eyebrow`, `link-underline`, marquee + hover-zoom motion.
- `src/sections/**` (booking scaffolds) is carried over from the template but
  unused and lint-excluded; safe to delete if never needed.
