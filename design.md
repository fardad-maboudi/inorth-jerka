# JERKA (ژرکا) — design.md

Design source of truth for the storefront UI refinement. Agents must read this before touching any UI file.
Scope: **Home page**, **Product List page (`/shop/products`)**, **Product Detail page (`/shop/productdetail/:id`)**, **Cart page (`/shop/cart`)**, **Cart Drawer overlay**, and the shared components (`Header`, `Footer`, `ProductCard`, `ProductGrid`, `ProductSlider`, `Pagination`).

Stack (do not change): React 19, Vite 7, Tailwind CSS v4 (`@theme` / `@utility` in `src/index.css`), react-router-dom v7, TanStack Query, Framer Motion, Lucide React, Vite PWA. This is **not** Next.js.

---

## 1. Principles

1. **Editorial, not SaaS.** Magazine rhythm: generous air, balanced typography, warm contrast bands, and tactile controls.
2. **Warm, never stark.** No `#000`, no `#fff`. Paper, ivory, sand, espresso, copper, terracotta clay, and saffron accents.
3. **Persian-first RTL.** Every layout decision is made in RTL first, then verified in nothing else. Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`).
4. **The server owns money.** The client displays server values; it never computes prices, discounts, totals, or stock.
5. **Quiet motion.** One easing curve (`EASE = [0.22, 1, 0.36, 1]`), transform/opacity only, zero `transition: all`, nothing that fights the content.
6. **Refine, don't rebuild.** Keep existing tokens, utilities (`eyebrow`, `btn-primary`, `btn-outline`, `link-underline`, `text-outline`, `section-padding`), `EASE`, and data hooks.

---

## 2. Reference Synthesis & Color Refresh

| Reference | What to Adopt | What NOT to Copy |
|---|---|---|
| **Aurelie** (accessories) | Ivory canvas; sand-tinted tiles; curated blocks with title + link; trending row with arrows; dark espresso footer; seasonal full-bleed banner | Latin-only serif everywhere, centered-everything headings, fake Instagram/UGC |
| **Brewly** (coffee) | Deep-green contrast band for hero/brand story; trust-icon row; clean product cards with descriptors; warm copper CTAs | Harsh shadows, star ratings unless server sends real data |
| **Jerka Color Refresh** (Lovable concept) | Rich moss hero band with lifestyle interior visual and stat pills; overlapping category cards; layered sand sidebar; harmonic pastels behind media; mid-grid espresso editorial break & saffron tip card; round copper action buttons | Cluttered icon strips, extraneous wishlist overlays on cards, nested passepartout borders around photos |

Resulting mood: **warm ivory paper + deep espresso ink + burnished copper, with deep pine/moss contrast bands** and earthy terracotta, saffron, and sand accents.

---

## 3. Color Tokens & Architecture

### 3.1 Primary Tokens (`src/index.css` `@theme`)
- **Canvas & Surfaces:**
  - `paper`: `#f7f3ec` (global body canvas)
  - `card`: `#fffdf9` (elevated card containers and input surfaces)
  - `sand`: `#f1e7da` (warm sand-tinted tiles and sidebar panel)
  - `sand-deep`: `#e5d7c3` (switch tracks, progress bar backgrounds)
  - `surface`: `#faf4ec` (soft alternative surface)
  - `line`: `#e4ddcf` (1px structural hairlines and dividers)
- **Ink & Contrast:**
  - `espresso`: `#1d1a16` (deep espresso ink for active buttons, badges, footer, and announcement strip)
  - `on-espresso`: `#f2efe9` (warm text over espresso)
  - `ink`: `#211d18` (primary typography, headings, prices)
  - `muted`: `#6b6459` (secondary text, labels, breadcrumbs, inactive icons)
- **Contrasting Pine/Moss Band:**
  - `moss-950`: `#141c17` · `moss-900`: `#1c2a22` · `moss-800`: `#27382d` · `moss-600`: `#4a6354`
  - `moss-mist`: `#eef3ef` (soft moss wash for media tiles)
  - `on-moss`: `#f3eee4` (warm ivory text over moss)
- **Harmonic Accents (Color Refresh):**
  - `brand-600`: `#a05c2c` (burnished copper, primary interactive, focus rings, plus buttons)
  - `brand-700`: `#844823` (hover/active copper)
  - `brand-400`: `#c79258` (champagne copper for hairline accents)
  - `clay`: `#c86a4b` (terracotta / brick for sale badges and highlights)
  - `clay-mist`: `#f7ede8` (soft clay wash for media tiles)
  - `saffron`: `#d99130` (golden saffron for seasonal eyebrows, stars, callouts)
  - `saffron-mist`: `#fbf3e5` (warm saffron wash for tip cards and media tiles)
  - `dusk-mist`: `#eef0ee` (soft dusk wash for media tiles)
  - `cream`: `#faf5ed` (soft cream for pill chips and inverted text)

### 3.2 Gradients & Utility Classes
```css
@utility bg-moss-band {
  background-image: radial-gradient(120% 140% at 85% 0%, #27382d 0%, #1c2a22 55%, #141c17 100%);
}
@utility bg-espresso-band {
  background-image: linear-gradient(180deg, #2b2620, #1d1a16);
}
@utility bg-copper-gradient {
  background-image: linear-gradient(135deg, #c86a4b, #a05c2c 55%, #844823);
}
@utility rule-dots {
  background-image: radial-gradient(circle, #dbcfbe 1.2px, transparent 1.6px);
  background-size: 10px 10px;
  background-position: center;
  background-repeat: repeat-x;
  height: 10px;
}
```

### 3.3 Visual Distribution Ratio (Per Page)
- ~60% `paper` / `card`
- ~20% `sand` / `surface` (sidebar containers, tiles, alternating blocks)
- ~10% `espresso` / `moss` (hero band, primary CTAs, footer, announcement)
- ~10% accents: `brand-600` (copper), `clay` (sale badges), `saffron` (stars, eyebrows, tip card), and pastel mist tints.

---

## 4. Typography

| Role | Font Family | Usage & Specifications |
|---|---|---|
| **Persian Headings** | **Estedad** 400/500/700 | Hero H1 `clamp(2rem, 5vw, 4rem)`, Section H2 `clamp(1.5rem, 3vw, 2.5rem)`, Card title 14–16px |
| **Persian Body** | **Vazirmatn** (variable) | 14–16px, line-height 1.8–1.85, `muted` for descriptions & captions |
| **Latin Accents & Display** | **Playfair Display** | Eyebrow labels, wordmark, Latin numbers only |

**Critical Persian Typography Rules:**
- **Never** apply `letter-spacing` (e.g. `tracking-tight`, `tracking-wide`) or `text-transform` to Persian text. It breaks the cursive letter shaping and ligature connections.
- Eyebrow `letter-spacing: 0.42em` is strictly for Latin text (`dir="ltr"`).
- Always apply `text-wrap: balance` to headings for natural Persian line wrapping.
- Prices & digits: Format using `formatPrice`, `formatMoney`, or `formatNumber` (Persian digits).

---

## 5. Components

### 5.1 Product Card (`ProductCard.jsx`) — Redesigned
Redesigned based on user reference and Lovable Color Refresh specifications:
- **Card Geometry:** Soft rounded card container (`rounded-3xl bg-card p-3 sm:p-3.5 shadow-sm border border-line/70 hover:shadow-md hover:border-brand-400/50 transition-all duration-300 hover:-translate-y-1`).
- **Media Frame:** Clean 4:5 aspect ratio photo with rounded corners (`rounded-2xl overflow-hidden bg-sand/30`).
  - *User Correction 1:* **No wishlist (heart) button** on the card.
  - *User Correction 2:* **No outer background/padding behind the photo** (the photo directly fills the top area of the card with `rounded-2xl`).
  - *Hover Motion:* Single-image subtle composite zoom (`group-hover:scale-105 duration-700 ease-out`). Never flip or swap images on hover.
  - *Badges:* Server-driven rounded pills pinned to top-start (`bg-clay text-white` for sale, `bg-moss-900 text-on-moss` for new, `bg-espresso/90 text-cream` for out of stock).
- **Product Information Hierarchy:**
  - *Row 1:* Category name on start (right in RTL, `text-brand-600 font-medium text-xs`), rating on end (left in RTL, `۴٫۳ ★ (۱۵)` with saffron star `fill-saffron text-saffron`).
  - *Row 2:* Product title (`font-heading font-bold text-sm sm:text-base text-ink line-clamp-2 mt-1.5`).
  - *Row 3:* Color swatches preview if available (`size-3.5 rounded-full ring-1 ring-espresso/15 shadow-xs mt-2.5`).
- **Bottom Action Row:**
  - *Price on Start (Right):* Compare-at price struck through if present; current price in bold Persian digits (`font-heading text-base sm:text-lg font-black text-ink`) + `تومان`.
  - *Action Button on End (Left):* Circular copper plus button (`size-10 sm:size-11 rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:scale-105 active:scale-95`). Shows `Loader2` while adding, `Check` upon success.

### 5.2 Product List Page (`ProductList.jsx`) — Architecture
- **Moss Hero Band:** Rich `bg-moss-band` full-width container at page top with:
  - Cream/saffron breadcrumb trail.
  - Saffron seasonal eyebrow ("مجموعه‌ی پاییز و زمستان ۱۴۰۵").
  - Bold Estedad H1 ("همه محصولات" or active category name).
  - Editorial lifestyle interior photography on desktop with a tilted saffron callout badge ("این هفته: کالاهای تازه").
  - Frosted glass stat badges (total products, categories, authenticity guarantee).
- **Overlapping Category Tiles:** Cards that sit on the bottom boundary of the hero band (`-mt-8 sm:-mt-10 relative z-10`), horizontally centered on the page (`mx-auto flex justify-center`), with image thumbnail, title, and live product count. Active tile transitions to deep espresso with saffron text.
- **Sticky Translucent Toolbar:** `bg-paper/85 backdrop-blur-xl border-y border-line/70 sticky top-0 z-30`:
  - Search input with clear button.
  - Tactile segmented control for sorting with sand track and espresso active indicator.
  - Mobile filter drawer trigger with active count badge.
- **Active Filter Chips:** Warm copper-mist pills (`bg-brand-50 border border-brand-200 text-brand-900 rounded-full px-3 py-1 text-xs`) with individual removal and a "پاک کردن همه" action.
- **Layered Sand Filter Sidebar (Refined from User Corrections):**
  - Outer container: `bg-sand/75 rounded-3xl p-6 border border-line/70 shadow-sm space-y-5`. All 4 corners have full `rounded-3xl` (24px) border-radius with zero clipping or protruding badges.
  - No internal scrollbar: No `overflow-y-auto` or height restriction on the sidebar container.
  - **In-Stock Switch Card:** Elevated white card (`bg-card rounded-2xl px-4 py-3.5 shadow-sm border border-line/60`) with tactile switch (`bg-sand-deep` off, `bg-brand-600` on, sliding white thumb).
  - Dotted divider rules (`rule-dots`).
  - **Real Store Categories:** Curated pill tags (`bg-card text-ink` turning `bg-espresso text-cream` when active) for "همه محصولات" and each store category with counts.
  - **Real Server Attributes / Facets:**
    - Color facets (`رنگ` / `color`): Rendered in the 3-column circular swatches grid using `COLOR_SWATCH_MAP` with the real store values (`آبی`, `سفید`, `کرم`, `مشکی`), centered checkmarks on active state, and Persian labels underneath.
    - Other facets (`سایز` / `size`, `جنس` / `material`): Rendered as organic pill tags (`bg-card` turning `bg-espresso text-cream` on active).
  - Consultation CTA card in warm copper gradient below the filter card (`bg-copper-gradient rounded-3xl p-6 text-cream shadow-md`).
- **Editorial Grid Interstitials:**
  - Mid-catalog editorial band (`bg-espresso-band rounded-2xl p-6 sm:p-8 text-cream shadow-lg`) after 6 products.
  - Saffron-tinted interior design tip card (`bg-saffron-mist rounded-2xl p-6 border border-saffron/30`) after 10 products.
- **Progress Indicator & Pagination:**
  - Copper progress bar indicating `نمایش X از Y کالا` with smooth CSS transition.
  - Tactile number pagination bar.
- **Mobile Filter Drawer:**
  - Bottom sheet with touch grab handle, frosted backdrop, smooth slide entrance (`EASE`), category pills, attribute chips, and sticky footer action.

### 5.3 Product Detail Page (`ProductDetail/[id].jsx`) — Redesigned
- **Scroll-Linked Gallery Motion & Frame:**
  - *Container:* Spacious rounded sand frame (`rounded-3xl bg-sand/35 border border-line/70 p-5 sm:p-7 md:p-8`) stretching alongside the product details section.
  - *Floating Inner Image Card:* The image is sized slightly smaller within its container (`w-[85%] sm:w-[82%] max-w-[420px] aspect-4/5 rounded-2xl overflow-hidden shadow-sm border border-line/70 bg-card`), giving generous breathing room on all sides.
  - *Scroll-Linked Parallax:* When the user scrolls down, the image moves downward within its own container, following scroll position with spring physics (`useScroll`, `useTransform`, `useSpring`) until it aligns with the vertical bottom of the adjacent product details section (max travel ~370px). Disabled on mobile.
  - *Reliable Gallery:* Resolves via `resolveProductGallery(product, variant)` ensuring high-resolution editorial photography is displayed.
  - *Thumbnails Strip:* Responsive thumbnail strip positioned directly below the image inside the moving unit with tactile active ring (`border-brand-600 ring-2 ring-brand-600/30 scale-105`).
  - *Editorial Badges:* Rounded pill badges pinned to top-start (`bg-clay text-white` for sale, `bg-moss-900 text-on-moss` for new, `bg-espresso/90 text-cream` for out of stock).
- **Buy Box & Details Hierarchy:**
  - *Breadcrumbs:* Clean Persian breadcrumb trail with saffron chevrons (`ChevronLeft size={13}`).
  - *Eyebrow in Latin serif:* `JERKA ATELIER` (`dir="ltr"`).
  - *Heading:* Estedad font, `text-wrap: balance`, zero `tracking-tight`.
  - *Rating:* Saffron star (`fill-saffron text-saffron`) with Persian digits and review count in a warm pill.
  - *Price Card:* Bold Estedad numerals + `تومان`, compare-at price struck through if present, and sale pill.
  - *Dotted Divider:* `rule-dots` separator.
  - *Variants:* Tactile pill chips turning `bg-espresso text-cream` on selection.
  - *Key Attributes:* Clean elevated card with close spacing (`gap-3` and `min-w-16` for label, never `justify-between`).
  - *Quantity Stepper:* Rounded-2xl pill container with tactile `Plus`/`Minus` buttons (`active:scale-95`) and Persian digits.
  - *Primary CTA:* Prominent `btn-primary` with copper gradient / brand-600, spinner (`Loader2`), and check (`Check`) states.
  - *Assurances:* 3 trust cards in warm sand tiles (`bg-sand/40 border border-line/60 rounded-2xl p-3`) with copper icons in white plates.
  - *Accordions:* Integrated inside the details column (`rounded-2xl border border-line/70 bg-card`) with smooth 200ms ease-out Chevron rotation.
- **Editorial Consultation Banner:** Warm copper gradient card (`bg-copper-gradient rounded-3xl p-6 sm:p-8 text-cream shadow-md`) offering personalized assistance.
- **Related Products:** Curated 4-column rail using the redesigned `ProductCard`.

### 5.4 Cart Drawer & Cart Page (`CartDrawer.jsx` & `Cart.jsx`) — Redesigned
Refined based on user screenshot and editorial guidelines:
- **Cart Drawer (`CartDrawer.jsx`):**
  - *Geometry & Docking:* Anchored to `end-0` (left in RTL), `max-w-[430px] sm:max-w-[450px]`, `bg-card border-s border-line/80 shadow-2xl` with `EASE` slide-in.
  - *Header:* Bold Estedad heading ("سبد خرید") with rounded sand counter chip (`bg-sand/70 text-brand-700 border border-line/60 rounded-full px-2.5 py-0.5 text-xs font-bold`) and tactile circular close button (`size-9 rounded-full bg-sand/40 hover:bg-sand text-muted hover:text-ink active:scale-90 border border-line/50`).
  - *Value-Add Strip:* Warm sand ribbon with `Truck` icon ("ارسال سریع و بسته‌بندی نفیس ژرکا به سراسر کشور").
  - *Item Tiles:* Elevated warm cards (`rounded-2xl bg-paper/50 border border-line/70 hover:border-brand-400/50 hover:bg-card p-3`). Rounded thumbnail with smooth scale hover (`rounded-xl overflow-hidden bg-sand/35 border border-line/60`).
  - *Item Stepper:* Organic pill stepper (`rounded-xl border border-line/80 bg-card p-0.5 shadow-2xs`) with tactile plus/minus buttons (`size-6 sm:size-7 rounded-lg active:scale-90`) and Persian bold digits.
  - *Item Trash:* Tactile soft button with hover red state (`size-7 rounded-lg text-muted/70 hover:text-state-error-ink hover:bg-rose-50 active:scale-90`).
  - *Footer:* Elevated white card footer (`border-t border-line/80 bg-card p-5 sm:p-6 shadow-lg space-y-4`). Total formatted with `formatMoney` and Persian numerals. Two tactile action buttons: "مشاهده سبد" (`btn-outline rounded-2xl py-3 active:scale-[0.98]`) on start (right in RTL) and "تسویه حساب" (`btn-primary rounded-2xl py-3 bg-espresso hover:bg-brand-600 text-cream active:scale-[0.98]`) on end (left in RTL). Reassurance strip at bottom ("ضمانت اصالت و امکان بازگشت ۷ روزه سفارش").
- **Cart Page (`Cart.jsx`):**
  - *Hero & Breadcrumbs:* Saffron chevron breadcrumbs (`خانه` > `فروشگاه` > `سبد خرید`), Latin serif eyebrow (`JERKA SHOPPING BAG`), Estedad H1 without `tracking-tight`, count summary, and quick "خالی کردن سبد" action.
  - *2-Column Layout:* Responsive grid on desktop (`grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8`).
  - *Main Column:* Spacious item cards (`rounded-3xl bg-card border border-line/70 p-4 sm:p-6 shadow-xs`) with enlarged rounded photo, bold title, unit price, stock badge ("آماده ارسال"), tactile pill stepper, bold Persian line total, and delete action. Bottom assurance row with 3 warm sand tiles (ShieldCheck, Truck, RefreshCcw).
  - *Order Summary Column:* Sticky sidebar (`rounded-3xl bg-sand/40 border border-line/70 p-6 sm:p-7 shadow-sm space-y-6 lg:sticky lg:top-28`). Rounded coupon code box with "اعمال کد" button and active tag pill. Dotted separator (`rule-dots`). Cost breakdown (`dl`) with subtotal, discounts in terracotta (`text-clay`), taxes, and final total in bold Estedad digits. Primary checkout CTA (`btn-primary w-full rounded-2xl py-4 font-bold text-base bg-espresso hover:bg-brand-600`) with arrow.
  - *Curated Recommendations:* Curated 4-column rail ("شاید به این کالاها هم علاقه‌مند باشید") powered by `useProducts` using the redesigned `ProductCard`.

---

## 6. Motion & Interaction

- **Single Easing:** `EASE = [0.22, 1, 0.36, 1]` (`cubic-bezier(0.22, 1, 0.36, 1)`) from `src/lib/motion.js`.
- **Zero `transition: all`:** Explicitly declare compositor-safe properties (`transform`, `opacity`, `background-color`, `border-color`, `color`).
- **Tactile Button Press Feedback:** All interactive buttons receive `:active { transform: scale(0.98); }` (or `active:scale-95` on small circular icon buttons).
- **Hover Gating:** All hover states gated behind `@media (hover: hover) and (pointer: fine)`.
- **Entrance Animation:** Never animate from `scale(0)`; start from `scale(0.96–0.98)` or `scale(1.02)` with opacity.
- **Accessibility:** Full respect for `prefers-reduced-motion` across all components and marquee bands.

---

## 7. Data & Backend Rules

- All requests are same-origin relative: `/api/v1/apps/<VITE_APP_ID>/...`.
- Use the existing API layer (`src/api/plugins/ecommerce.js`) and TanStack Query hooks.
- Server owns money: never calculate prices, discounts %, taxes, shipping, or stock on the client.
- Skeletons must match exact dimensions of the loaded state (aspect 4:5) to prevent Cumulative Layout Shift (CLS < 0.1).

---

## 8. Learned Taste (from User Corrections)

1. **Category Tiles Quantity & Alignment (Home Page)**
   - Category strip showcases exactly 4 curated categories (`slice(0, 4)`). Category section header text remains start-aligned (`text-start`), preserving natural RTL editorial reading flow. The image containers are centered and square.

2. **Product Media Hover Stability (Storefront-wide)**
   - Never switch or crossfade to an alternate image on card hover. Maintain single-image stability and apply only subtle, composited image zoom (`scale(1.05)` with `cubic-bezier(0.22, 1, 0.36, 1)`).

3. **Curated Gift Edit Presentation (Home Page)**
   - Background image remains sharp overall. Localized espresso gradient scrim and feathered backdrop blur activates strictly behind the text in the lower ~70% of the card. Text glides upward slightly lower than vertical center.

4. **Motion Polish Guidelines**
   - Parallax is applied exclusively to the hero image layer, strictly limited to `<= 8%` vertical travel, disabled on mobile/touch, and disabled under `prefers-reduced-motion`. All buttons provide tactile `:active` feedback. Zero `transition: all` across components.

5. **Product Detail Spacing & Image Stability**
   - In product detail key attributes, label and value must sit close together with `gap-3` and `min-w-14`, never `justify-between` which flings them to opposite ends of the screen.
   - Product gallery must always resolve through `resolveProductGallery(product, variant)` to ensure high-resolution photography is always displayed.
   - Zero `tracking-tight` on Persian headings.

6. **Product Card Geometry & Elements (User Screenshot Correction)**
   - **No wishlist (heart) button:** The card header must omit any floating heart or wishlist button (User marking 1).
   - **No background/passepartout padding behind the photo:** The photo container must sit directly inside the card with `rounded-2xl` without an outer padding box or secondary background frame (User marking 2).
   - **Card structure:**
     - Top row: category label on start (right), review rating with saffron star on end (left).
     - Second row: bold Persian product title.
     - Third row: color swatch dots if variants/colors exist.
     - Fourth row: price on start (right) and circular copper plus button (`size-10 sm:size-11 rounded-full bg-brand-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md`) on end (left).

7. **Category Filter Sidebar (User Screenshot Reference & Corrections)**
   - The catalog filter sidebar uses a soft sand container (`rounded-3xl bg-sand/75 p-6 border border-line/70 shadow-sm space-y-5`).
   - All 4 corners possess uniform `rounded-3xl` curvature. No prototype badges (e.g. Pin 5 / 6) or negative positioning.
   - Zero internal scrollbars (`overflow-y-auto` removed) so the sidebar breathes naturally without browser scrollbars.
   - First control: Elevated white card for "فقط کالاهای موجود" with tactile pill toggle switch.
   - Preserves real store values:
     - Categories: Organic pill tags for all store categories.
     - Color attribute: 3-column circular swatches grid with actual store colors (`آبی`, `سفید`, `کرم`, `مشکی`), active checkmark, active ring, and Persian labels directly underneath.
     - Other attributes (e.g. `سایز` / `size`): Organic pill tags that turn espresso on active.
   - Separators between all sections use subtle dotted divider rules (`rule-dots`).

8. **Header Cart Button (User Reference Specification)**
   - Replaces the bare icon with a tactile dark espresso pill button: `rounded-full bg-espresso py-2 px-3.5 sm:py-2.5 sm:pr-4 sm:pl-3 text-xs sm:text-sm font-bold text-cream`.
   - Contains bold Persian label "سبد" alongside `<ShoppingBag size={16} strokeWidth={2} />`.
   - Floating circular copper badge (`bg-brand-600 text-white size-5 rounded-full ring-2 ring-paper shadow-xs`) at the top-left corner (`-top-1.5 -left-1.5`) displaying the live cart count in Persian digits.
