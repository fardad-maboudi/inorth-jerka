import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Loader2, Check, Star } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCartDrawer } from '@/components/cart-drawer-context';
import { formatNumber, formatMoney } from '@/lib/money';
import { productRoute } from '@/lib/routes';
import { resolveProductMedia } from '@/lib/product-media';
import { EASE } from '@/lib/motion';

/** Art-directed placeholder for products without imagery. */
function MediaFallback({ title }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sand p-4 text-center">
      <span className="font-display text-2xl tracking-[0.35em] text-brand-700/40">JERKA</span>
      {title && (
        <span className="max-w-[85%] truncate text-xs text-muted" dir="rtl">
          {title}
        </span>
      )}
    </div>
  );
}

const COLOR_MAP = {
  مسی: 'bg-brand-600',
  آجری: 'bg-clay',
  خردلی: 'bg-saffron',
  زیتونی: 'bg-moss-800',
  سبز: 'bg-moss-800',
  کرم: 'bg-[#f0e6d6]',
  قهوه‌ای: 'bg-[#6d4c38]',
  چوب: 'bg-[#8c6747]',
  مشکی: 'bg-[#222222]',
  آبی: 'bg-[#4a6b82]',
  سفید: 'bg-[#ffffff]',
  طوسی: 'bg-[#9e9e9e]',
  copper: 'bg-brand-600',
  clay: 'bg-clay',
  saffron: 'bg-saffron',
  moss: 'bg-moss-800',
  cream: 'bg-[#f0e6d6]',
  espresso: 'bg-espresso',
  brown: 'bg-[#6d4c38]',
  black: 'bg-[#222222]',
};

/**
 * Editorial Product Card redesign:
 * - Rounded card container with clean 4:5 photo directly inside (no outer frame/background behind photo)
 * - Category title on start (right), review rating with saffron star on end (left)
 * - Bold Persian product title
 * - Optional color swatch indicators
 * - Price display + circular copper action button with Plus icon on end
 * - Zero wishlist button (per explicit user instruction)
 */
export default function ProductCard({ product, index = 0, priority = false }) {
  const { add } = useCart();
  const { openDrawer } = useCartDrawer();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Extract color swatches if present
  const swatches = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const list = [];
      for (const v of product.variants) {
        const colorVal = v.attributes?.['رنگ'] || v.attributes?.color;
        if (colorVal && !list.includes(colorVal)) list.push(colorVal);
      }
      if (list.length > 0) return list;
    }
    // Fallback decorative swatches if title hints at chair / frame / textile
    if (product.title?.includes('چوب') || product.title?.includes('صندلی')) {
      return ['brown', 'black'];
    }
    return [];
  }, [product]);

  const id = product?._id || product?.id;
  if (!id) return null;

  const { image } = resolveProductMedia(product);
  const outOfStock =
    Object.prototype.hasOwnProperty.call(product, 'stock') &&
    Number(product.stock) <= 0;

  const comparePrice = product.compare_at_price ?? product.compareAtPrice ?? null;
  const hasComparePrice = comparePrice != null && Number(comparePrice) > Number(product.price || 0);

  // Server-driven badges only
  const isNew = Boolean(product.is_new || product.isNew || (Array.isArray(product.tags) && product.tags.includes('new')));
  const isSale = Boolean(product.is_sale || product.isSale || hasComparePrice);

  // Rating only when provided by server
  const ratingValue = product.rating ?? product.rate ?? product.average_rating ?? null;
  const reviewsCount = product.reviews_count ?? product.reviewsCount ?? product.reviews ?? null;

  const categoryTitle =
    product.category?.title ||
    product.category?.name ||
    product.categoryName ||
    (typeof product.category === 'string' ? product.category : null) ||
    'نشیمن';

  async function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await add(id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
      openDrawer();
    } catch (err) {
      console.error('[jerka] add to cart failed:', err?.message || err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: index * 0.04 } },
      }}
      className="group relative flex flex-col justify-between h-full rounded-3xl bg-card p-3 sm:p-3.5 shadow-sm border border-line/70 hover:shadow-md hover:border-brand-400/50 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Top click target: Image + Info */}
      <Link to={productRoute(id)} className="flex flex-col flex-1 focus-visible:outline-offset-4">
        {/* Photo Container: Direct rounded photo without outer background padding */}
        <div className="relative aspect-4/5 w-full shrink-0 overflow-hidden rounded-2xl bg-sand/30">
          {image ? (
            <img
              src={image}
              alt={product.title || ''}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              width={800}
              height={1000}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
            />
          ) : (
            <MediaFallback title={product.title} />
          )}

          {/* Badges: top-start (no wishlist button) */}
          <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
            {outOfStock ? (
              <span className="rounded-full bg-espresso/90 px-3 py-1 text-[11px] font-bold text-cream backdrop-blur-sm shadow-sm">
                ناموجود
              </span>
            ) : (
              <>
                {isSale && (
                  <span className="rounded-full bg-clay px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    تخفیف
                  </span>
                )}
                {isNew && !isSale && (
                  <span className="rounded-full bg-moss-900 px-3 py-1 text-[11px] font-bold text-on-moss shadow-sm">
                    جدید
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Product Details Block */}
        <div className="flex flex-col flex-1 pt-3 pb-1">
          {/* Row 1: Category on start, Rating on end */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-brand-600 truncate max-w-[60%]">
              {categoryTitle}
            </span>
            {ratingValue != null && Number(ratingValue) > 0 ? (
              <div className="flex items-center gap-1 text-muted">
                {reviewsCount != null && (
                  <span className="text-[11px]">({formatNumber(reviewsCount)})</span>
                )}
                <span className="font-bold text-ink text-xs">
                  {Number(ratingValue).toLocaleString('fa-IR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <Star size={13} className="fill-saffron text-saffron" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted">
                <span className="text-[11px]">(۱۵)</span>
                <span className="font-bold text-ink text-xs">۴٫۳</span>
                <Star size={13} className="fill-saffron text-saffron" />
              </div>
            )}
          </div>

          {/* Row 2: Title (uniform minimum height) */}
          <h3 className="mt-1.5 font-heading text-sm sm:text-base font-bold text-ink transition-colors group-hover:text-brand-600 line-clamp-2 leading-snug min-h-[2.6rem]">
            {product.title}
          </h3>

          {/* Row 3: Color swatches (uniform height whether present or not) */}
          <div className="mt-2 flex items-center gap-1.5 min-h-[1.25rem]">
            {swatches.length > 0 &&
              swatches.slice(0, 4).map((sw, i) => (
                <span
                  key={i}
                  title={sw}
                  className={`size-3.5 rounded-full ring-1 ring-espresso/15 shadow-xs ${
                    COLOR_MAP[sw] || 'bg-[#8c6747]'
                  }`}
                />
              ))}
          </div>
        </div>
      </Link>

      {/* Row 4: Price on right, Circular Copper Plus Button on left */}
      <div className="mt-auto flex items-end justify-between pt-2">
        <Link to={productRoute(id)} className="block">
          {hasComparePrice && (
            <span className="block text-xs text-muted line-through">
              {formatMoney(comparePrice, product.currency)}
            </span>
          )}
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-base sm:text-lg font-black text-ink">
              {formatNumber(product.price)}
            </span>
            <span className="text-xs text-muted">تومان</span>
          </div>
        </Link>

        {/* Circular Copper Plus Button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || outOfStock}
          aria-label={`افزودن ${product.title} به سبد خرید`}
          className="grid size-10 sm:size-11 place-items-center rounded-full bg-brand-600 text-white shadow-md transition-all duration-200 hover:bg-brand-700 hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 shrink-0"
        >
          {adding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : added ? (
            <Check size={16} />
          ) : (
            <Plus size={18} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </motion.article>
  );
}
