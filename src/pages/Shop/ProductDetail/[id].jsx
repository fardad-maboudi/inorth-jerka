import { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Star,
  Loader2,
  Check,
  Sparkles,
  MessageCircleQuestion,
  ChevronDown,
  X,
  ZoomIn,
} from 'lucide-react';
import { getProduct, searchProducts, useCategory } from '@/api/plugins/ecommerce';
import { useCart } from '@/lib/cart-context';
import { useCartDrawer } from '@/components/cart-drawer-context';
import ProductGrid from '@/components/ProductGrid';
import Reveal from '@/components/Reveal';
import { formatPrice, formatMoney, formatNumber } from '@/lib/money';
import { ROUTES } from '@/lib/routes';
import { fadeUp, staggerParent, EASE } from '@/lib/motion';
import { resolveProductGallery } from '@/lib/product-media';

/**
 * Editorial Gallery with Scroll-Linked Parallax Translation:
 * - Image is slightly smaller within its container (padded frame with floating card).
 * - When user scrolls down, the image moves downward within its own container,
 *   smoothly following scroll progress until it reaches the same vertical position
 *   as the adjacent product details section.
 * - Smooth AnimatePresence crossfade when switching thumbnails.
 * - Responsive thumbnail strip with tactile active feedback.
 * - Server-driven editorial badges (جدید، تخفیف، ناموجود).
 */
function Gallery({ images = [], title = '', badges = [], containerRef }) {
  const [active, setActive] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageBlockRef = useRef(null);
  const [maxTravel, setMaxTravel] = useState(0);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation & body scroll lock for modal
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
      if (e.key === 'ArrowRight') setActive((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === 'ArrowLeft') setActive((prev) => (prev + 1) % images.length);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, images.length]);

  // Chevrons navigation helpers
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActive((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActive((prev) => (prev - 1 + images.length) % images.length);
  };

  // Measure container height vs image block height to compute travel range
  useEffect(() => {
    if (!containerRef?.current || !imageBlockRef.current) return;

    const measure = () => {
      if (!containerRef?.current || !imageBlockRef.current) return;
      if (window.innerWidth < 1024) {
        setMaxTravel(0);
        return;
      }
      const cHeight = containerRef.current.offsetHeight;
      const iHeight = imageBlockRef.current.offsetHeight;
      // Padding of container: p-5 sm:p-7 md:p-8 is ~32px top + 32px bottom = 64px
      const available = Math.max(0, cHeight - iHeight - 64);
      setMaxTravel(available);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    if (imageBlockRef.current) ro.observe(imageBlockRef.current);

    return () => ro.disconnect();
  }, [containerRef, images]);

  // Scroll tracking: begins when container top reaches near header (160px from top of viewport)
  // and reaches 1.0 when the container bottom reaches the viewport bottom
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 160px', 'end end'],
  });

  const rawY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, isDesktop ? maxTravel : 0],
    { clamp: true }
  );

  const smoothY = useSpring(rawY, {
    stiffness: 220,
    damping: 28,
    mass: 0.4,
  });

  if (!images.length) {
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center rounded-2xl border border-line bg-sand/50">
        <span className="font-display text-4xl tracking-[0.35em] text-brand-700/40">JERKA</span>
      </div>
    );
  }

  const safeIndex = active < images.length ? active : 0;
  const currentSrc = images[safeIndex];

  return (
    <>
      <motion.div
        ref={imageBlockRef}
        style={{ y: isDesktop ? smoothY : 0 }}
        className="relative w-full max-w-[390px] sm:max-w-[420px] flex flex-col items-center gap-4 will-change-transform"
      >
        {/* Main image card: slightly smaller inside the container with rounded-2xl, border, and shadow */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          aria-label={`بزرگ‌نمایی تصویر ${title}`}
          className="group relative aspect-4/5 w-[85%] sm:w-[82%] overflow-hidden rounded-2xl border border-line/70 bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-zoom-in focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSrc}
              src={currentSrc}
              alt={title ? `${title} — تصویر ${safeIndex + 1}` : ''}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </AnimatePresence>

          {/* Server-driven editorial badges */}
          {badges.length > 0 && (
            <div className="pointer-events-none absolute start-3.5 top-3.5 z-10 flex flex-col gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.text}
                  className={`rounded-full px-3 py-1 text-xs font-medium leading-none tracking-normal shadow-xs ${
                    b.variant === 'espresso'
                      ? 'bg-moss-900 text-on-moss'
                      : b.variant === 'copper'
                        ? 'bg-clay text-white'
                        : 'bg-espresso/90 text-cream'
                  }`}
                >
                  {b.text}
                </span>
              ))}
            </div>
          )}

          {/* Subtle zoom badge on hover */}
          <div className="pointer-events-none absolute bottom-3 end-3 z-10 size-7 rounded-full bg-espresso/70 text-cream backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xs">
            <ZoomIn size={13} />
          </div>

          {/* Left & Right Chevrons */}
          {images.length > 1 && (
            <>
              {/* Right chevron button */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="تصویر قبلی"
                className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-9 rounded-full bg-card/85 sm:bg-card/75 backdrop-blur-md text-ink border border-line/80 shadow-xs flex items-center justify-center transition-all duration-200 hover:bg-card hover:scale-110 active:scale-95 group-hover:opacity-100 opacity-90 sm:opacity-80"
              >
                <ChevronRight size={17} />
              </button>

              {/* Left chevron button */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="تصویر بعدی"
                className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-9 rounded-full bg-card/85 sm:bg-card/75 backdrop-blur-md text-ink border border-line/80 shadow-xs flex items-center justify-center transition-all duration-200 hover:bg-card hover:scale-110 active:scale-95 group-hover:opacity-100 opacity-90 sm:opacity-80"
              >
                <ChevronLeft size={17} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails row */}
        {images.length > 1 && (
          <div
            className="flex items-center justify-center flex-wrap gap-2.5 pt-1"
            role="tablist"
            aria-label="تصاویر محصول"
          >
            {images.slice(0, 5).map((src, i) => {
              const isSelected = safeIndex === i;
              return (
                <button
                  key={src + i}
                  type="button"
                  role="tab"
                  onClick={() => setActive(i)}
                  aria-label={`نمایش تصویر ${i + 1} از ${title}`}
                  aria-selected={isSelected}
                  className={`relative size-13 sm:size-14 overflow-hidden rounded-xl border bg-card p-0.5 transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'border-brand-600 ring-2 ring-brand-600/30 opacity-100 scale-105'
                      : 'border-line/80 opacity-70 hover:opacity-100 hover:border-brand-400'
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full rounded-[9px] object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/85 backdrop-blur-md p-4 sm:p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`نمایش تمام‌صفحه تصویر ${title}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center max-w-4xl w-full max-h-[92vh]"
            >
              {/* Modal Top Control Bar */}
              <div className="flex w-full items-center justify-between pb-3 sm:pb-4 text-cream">
                {/* Counter & title pill */}
                <div className="flex items-center gap-2 rounded-full bg-espresso/70 border border-white/10 px-3.5 py-1 text-xs font-heading font-medium text-cream backdrop-blur-xs">
                  <span className="truncate max-w-[180px] sm:max-w-xs">{title}</span>
                  <span className="text-white/40">•</span>
                  <span>
                    {(safeIndex + 1).toLocaleString('fa-IR')} از {images.length.toLocaleString('fa-IR')}
                  </span>
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="بستن تصویر"
                  className="size-9 sm:size-10 rounded-full bg-card/90 text-ink border border-line/70 shadow-md flex items-center justify-center hover:bg-card hover:scale-105 active:scale-95 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Image Box */}
              <div className="relative flex items-center justify-center w-full max-h-[70vh] sm:max-h-[74vh] overflow-hidden rounded-3xl bg-card border border-line/70 p-3 sm:p-5 shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSrc}
                    src={currentSrc}
                    alt={title ? `${title} — تصویر ${safeIndex + 1}` : ''}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="max-h-[64vh] sm:max-h-[68vh] w-auto max-w-full object-contain rounded-2xl select-none"
                  />
                </AnimatePresence>

                {/* Modal Chevrons */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="تصویر قبلی"
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-card/90 text-ink border border-line/70 shadow-md flex items-center justify-center hover:bg-card hover:scale-110 active:scale-95 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="تصویر بعدی"
                      className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-card/90 text-ink border border-line/70 shadow-md flex items-center justify-center hover:bg-card hover:scale-110 active:scale-95 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Modal Thumbnails Strip */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3 sm:pt-4 overflow-x-auto max-w-full">
                  {images.map((src, i) => {
                    const isSelected = safeIndex === i;
                    return (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`انتخاب تصویر ${i + 1}`}
                        className={`relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border bg-card p-0.5 transition-all duration-200 active:scale-95 ${
                          isSelected
                            ? 'border-brand-600 ring-2 ring-brand-600/40 opacity-100 scale-105'
                            : 'border-white/20 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full rounded-[8px] object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Editorial Accordion:
 * - Clean tactile card with rounded-2xl styling
 * - Smooth Framer Motion expand/collapse
 * - 200ms ease-out Chevron rotation
 */
function Accordion({ title, children, defaultOpen = false, icon: Icon = Sparkles }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-line/70 bg-card overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-start font-heading text-sm font-semibold text-ink transition-colors duration-200 hover:text-brand-600"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-xl bg-sand/60 text-brand-600">
            <Icon size={16} strokeWidth={1.8} />
          </span>
          <span>{title}</span>
        </div>
        <ChevronDown
          size={17}
          strokeWidth={1.8}
          className={`text-muted transition-transform duration-250 ease-out ${open ? 'rotate-180 text-brand-600' : 'rotate-0'}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 pt-1 text-sm leading-8 text-muted border-t border-line/40">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

const ASSURANCES = [
  { icon: ShieldCheck, title: 'اصالت کالا', text: 'ضمانت اصالت و کیفیت تمام محصولات' },
  { icon: Truck, title: 'ارسال ایمن', text: 'ارسال با بسته‌بندی ویژه در کوتاه‌ترین زمان' },
  { icon: RefreshCcw, title: 'بازگشت آسان', text: '۷ روز مهلت تعویض یا بازگشت سفارش' },
];

export default function ProductDetail() {
  const { id } = useParams();

  const {
    data: product = null,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['jerka', 'product', id],
    queryFn: () => getProduct(id),
    staleTime: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="container-max pt-6 sm:pt-8">
        {error ? (
          <div className="mx-auto max-w-lg border border-line bg-card p-10 text-center rounded-3xl my-12 shadow-sm">
            <h1 className="font-heading text-xl font-bold text-ink">محصول مورد نظر یافت نشد</h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {error.message || 'ممکن است این محصول حذف شده یا آدرس وارد شده نادرست باشد.'}
            </p>
            <Link to={ROUTES.shop} className="btn-outline mt-8 px-6 py-2.5 text-xs rounded-full">
              بازگشت به فروشگاه
            </Link>
          </div>
        ) : isLoading || !product ? (
          <ProductSkeleton />
        ) : (
          <LoadedProduct key={product._id || product.id} product={product} />
        )}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div>
      {/* Breadcrumb skeleton */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-4 w-14 rounded-full bg-line/60 animate-pulse" />
        <span className="text-line">/</span>
        <div className="h-4 w-16 rounded-full bg-line/60 animate-pulse" />
        <span className="text-line">/</span>
        <div className="h-4 w-32 rounded-full bg-line/60 animate-pulse" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14" aria-busy>
        {/* Gallery skeleton */}
        <div className="h-[640px] w-full rounded-3xl border border-line/70 bg-sand/40 animate-pulse flex items-center justify-center p-8">
          <div className="aspect-4/5 w-4/5 rounded-2xl bg-card/60 animate-pulse" />
        </div>

        {/* Buy box skeleton */}
        <div className="space-y-6 pt-2">
          <div className="h-3.5 w-24 rounded-full bg-line/60 animate-pulse" />
          <div className="h-9 w-3/4 rounded-2xl bg-line/70 animate-pulse" />
          <div className="h-7 w-1/3 rounded-full bg-line/60 animate-pulse" />
          <div className="border-t border-line/60 pt-6 space-y-3">
            <div className="h-4 w-full rounded-full bg-line/45 animate-pulse" />
            <div className="h-4 w-5/6 rounded-full bg-line/45 animate-pulse" />
            <div className="h-4 w-2/3 rounded-full bg-line/45 animate-pulse" />
          </div>
          <div className="h-14 w-full rounded-2xl bg-line/50 animate-pulse pt-4" />
        </div>
      </div>
    </div>
  );
}

function LoadedProduct({ product }) {
  const { add } = useCart();
  const { openDrawer } = useCartDrawer();
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const galleryContainerRef = useRef(null);
  const detailsColRef = useRef(null);

  // Category lookup for breadcrumb
  const { data: categoryData } = useCategory(product?.categoryId, {
    enabled: Boolean(product?.categoryId),
  });

  // Related suggestions
  const { data: relatedData } = useRelated(product);

  const productId = product._id || product.id;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const attrs = product.attributes && typeof product.attributes === 'object' ? product.attributes : {};
  const priceable = variant?.price != null ? variant : product;
  const outOfStock =
    Object.prototype.hasOwnProperty.call(product, 'stock') && Number(product.stock) <= 0;

  // Compare-at price from server
  const comparePrice = priceable.compare_at_price ?? priceable.compareAtPrice ?? null;
  const hasComparePrice =
    comparePrice != null && Number(comparePrice) > Number(priceable.price || 0);

  // Server-driven rating data
  const ratingValue = product.rating ?? product.rate ?? product.average_rating ?? null;

  // Resolve gallery images
  const galleryImages = resolveProductGallery(product, variant);

  // Server-driven editorial badges
  const isNew = Boolean(
    product.is_new ||
      product.isNew ||
      (Array.isArray(product.tags) && product.tags.includes('new')),
  );
  const isSale = Boolean(product.is_sale || product.isSale || hasComparePrice);

  const badges = [];
  if (outOfStock) {
    badges.push({ text: 'ناموجود', variant: 'muted' });
  } else {
    if (isNew) badges.push({ text: 'جدید', variant: 'espresso' });
    if (isSale) badges.push({ text: 'تخفیف', variant: 'copper' });
  }

  // Localized attributes list
  const attributesToRender = Array.isArray(product.attributeList) && product.attributeList.length > 0
    ? product.attributeList
    : Object.entries(attrs).map(([key, value]) => ({ label: key, value }));

  async function handleAdd() {
    if (adding || outOfStock) return;
    setAdding(true);
    try {
      await add(productId, qty);
      setAdded(true);
      openDrawer();
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      console.error('[jerka] add to cart failed:', err?.message || err);
    } finally {
      setAdding(false);
    }
  }

  const categoryName = categoryData?.name || product?.categoryName || product?.category?.title || null;

  return (
    <div>
      {/* Editorial Breadcrumbs */}
      <nav aria-label="مسیر صفحه" className="mb-6 md:mb-8 text-xs text-muted">
        <ol className="flex items-center flex-wrap gap-2">
          <li>
            <Link to={ROUTES.home} className="transition-colors duration-200 hover:text-brand-600">
              خانه
            </Link>
          </li>
          <li aria-hidden className="text-saffron">
            <ChevronLeft size={13} />
          </li>
          <li>
            <Link to={ROUTES.shop} className="transition-colors duration-200 hover:text-brand-600">
              فروشگاه
            </Link>
          </li>
          {categoryName && (
            <>
              <li aria-hidden className="text-saffron">
                <ChevronLeft size={13} />
              </li>
              <li>
                <Link
                  to={`${ROUTES.shop}?category=${product.categoryId}`}
                  className="transition-colors duration-200 hover:text-brand-600 font-medium"
                >
                  {categoryName}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden className="text-saffron">
            <ChevronLeft size={13} />
          </li>
          <li className="truncate font-semibold text-ink max-w-xs sm:max-w-md">
            {product.title}
          </li>
        </ol>
      </nav>

      {/* Main product showcase: 2 columns in desktop with scroll tracking */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-start lg:items-stretch">
        {/* Column 1: Gallery outer container (Image moves downward inside this container) */}
        <div
          ref={galleryContainerRef}
          className="relative h-full min-h-[520px] lg:min-h-full rounded-3xl bg-sand/35 border border-line/70 p-5 sm:p-7 md:p-8 flex flex-col items-center justify-start overflow-hidden shadow-2xs"
        >
          {/* Subtle warm decorative glow inside container */}
          <div className="pointer-events-none absolute -top-12 -left-12 size-48 rounded-full bg-brand-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-48 rounded-full bg-saffron/10 blur-2xl" />

          <Gallery
            images={galleryImages}
            title={product.title}
            badges={badges}
            containerRef={galleryContainerRef}
          />
        </div>

        {/* Column 2: Buy box / Product Details Section (Full height with specs, assurances, and accordions) */}
        <motion.div
          ref={detailsColRef}
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="max-w-xl flex flex-col justify-between space-y-6"
        >
          <div>
            {/* Atelier Eyebrow */}
            <motion.p variants={fadeUp} className="eyebrow" dir="ltr">
              JERKA ATELIER
            </motion.p>

            {/* Title: Estedad font, balanced wrap, strictly NO tracking-tight */}
            <motion.h1
              variants={fadeUp}
              className="mt-2 font-heading text-2xl font-bold leading-snug text-ink sm:text-3xl lg:text-4xl text-wrap-balance"
            >
              {product.title}
            </motion.h1>

            {/* Optional server rating */}
            {ratingValue != null && (
              <motion.div variants={fadeUp} className="mt-3 flex items-center gap-2 text-xs text-muted">
                <div className="flex items-center gap-1 bg-saffron-mist text-ink border border-saffron/30 rounded-full px-2.5 py-0.5">
                  <Star size={13} className="fill-saffron text-saffron" />
                  <span className="font-heading font-bold tabular-nums">
                    {Number(ratingValue).toLocaleString('fa-IR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
                {product.reviews_count != null && (
                  <span>({Number(product.reviews_count).toLocaleString('fa-IR')} نظر خریداران)</span>
                )}
              </motion.div>
            )}

            {/* Price display with compare-at price when sent by server */}
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-ink">
                {formatPrice(priceable)}
              </span>
              {hasComparePrice && (
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg text-muted line-through font-display">
                    {formatMoney(comparePrice, priceable.currency)}
                  </span>
                  <span className="bg-clay/15 text-clay border border-clay/30 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    تخفیف ویژه
                  </span>
                </div>
              )}
            </motion.div>

            {/* Dotted divider rule */}
            <div className="rule-dots my-6" />

            {/* Product description excerpt */}
            {product.description && (
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base leading-8 text-muted whitespace-pre-line"
              >
                {product.description}
              </motion.p>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <motion.div variants={fadeUp} className="mt-7">
                <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted">
                  انتخاب گزینه و تنوع
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((vr, i) => {
                    const isSelected = variant === vr;
                    const label =
                      Object.values(vr.attributes || {}).join(' / ') ||
                      vr.sku ||
                      `گزینه ${(i + 1).toLocaleString('fa-IR')}`;
                    return (
                      <button
                        key={vr.sku || i}
                        type="button"
                        onClick={() => setVariant(isSelected ? null : vr)}
                        aria-pressed={isSelected}
                        className={`rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 active:scale-95 ${
                          isSelected
                            ? 'border-espresso bg-espresso text-cream font-medium shadow-sm'
                            : 'border-line/80 bg-card text-ink hover:border-brand-400 shadow-2xs'
                        }`}
                      >
                        <span>{label}</span>
                        {vr.price != null && (
                          <span className="ms-2 font-heading text-xs opacity-75">
                            {formatMoney(vr.price, product.currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Attributes */}
            {attributesToRender.length > 0 && (
              <motion.div variants={fadeUp} className="mt-7 rounded-2xl bg-card border border-line/60 p-4 sm:p-5 shadow-2xs">
                <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted">
                  مشخصات کلیدی کالا
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  {attributesToRender.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 border-b border-line/40 pb-2"
                    >
                      <dt className="min-w-16 shrink-0 text-xs text-muted">{label}:</dt>
                      <dd className="text-xs sm:text-sm font-semibold text-ink">
                        {Array.isArray(value) ? value.join('، ') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </div>

          <div>
            {/* Quantity Stepper + Add to Cart CTA */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              {/* Stepper */}
              <div className="inline-flex items-center rounded-2xl border border-line/70 bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQty((n) => n + 1)}
                  aria-label="افزایش تعداد"
                  disabled={outOfStock}
                  className="size-10 rounded-xl flex items-center justify-center text-muted transition-colors duration-150 hover:bg-sand/60 hover:text-ink active:scale-95 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
                <span className="min-w-10 text-center font-heading font-bold text-sm tabular-nums text-ink">
                  {formatNumber(qty)}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  aria-label="کاهش تعداد"
                  disabled={outOfStock || qty <= 1}
                  className="size-10 rounded-xl flex items-center justify-center text-muted transition-colors duration-150 hover:bg-sand/60 hover:text-ink active:scale-95 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding || outOfStock}
                className="btn-primary min-h-[50px] flex-1 min-w-[200px] rounded-2xl font-heading font-bold text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                {outOfStock ? (
                  'ناموجود'
                ) : adding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    در حال افزودن به سبد…
                  </>
                ) : added ? (
                  <>
                    <Check size={18} />
                    به سبد اضافه شد ✓
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={1.8} />
                    افزودن به سبد خرید
                  </>
                )}
              </button>
            </motion.div>

            {/* Assurances list */}
            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-line/70 pt-6">
              {ASSURANCES.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-line/60 bg-sand/40 p-3 transition-colors hover:bg-sand/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card border border-brand-400/30 text-brand-600 shadow-2xs">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="font-heading text-xs font-bold text-ink">{title}</h3>
                    <p className="text-[11px] text-muted line-clamp-1">{text}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Details & Policies Accordion inside Details Section */}
            <motion.div variants={fadeUp} className="mt-8 space-y-3 pt-6 border-t border-line/70">
              <Accordion title="جزئیات و مشخصات کامل کالا" defaultOpen icon={Sparkles}>
                <p>{product.description || 'توضیحات تکمیلی برای این کالا ثبت نشده است.'}</p>
              </Accordion>
              <Accordion title="ارسال و بسته‌بندی ویژه ژرکا" icon={Truck}>
                سفارش‌های ثبت‌شده حداکثر ظرف ۲۴ الی ۴۸ ساعت کاری در بسته‌بندی ایمن و اختصاصی ژرکا آماده‌سازی
                و ارسال می‌شوند. برای سفارش‌های بالای ۱ میلیون تومان، ارسال در سراسر کشور رایگان خواهد بود.
              </Accordion>
              <Accordion title="ضمانت اصالت و بازگشت ۷ روزه" icon={ShieldCheck}>
                تمام کالاهای ارائه‌شده در ژرکا دارای ضمانت اصالت فیزیکی هستند. در صورت مغایرت یا وجود هرگونه
                ایراد، تا ۷ روز پس از تحویل امکان بازگشت کامل وجه یا تعویض کالا برای خریدار محترم فراهم است.
              </Accordion>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Editorial consultation card */}
      <div className="mx-auto mt-14 max-w-4xl rounded-3xl bg-copper-gradient p-6 sm:p-8 text-cream shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-cream backdrop-blur-xs">
            <MessageCircleQuestion size={24} />
          </span>
          <div>
            <h4 className="font-heading font-bold text-base sm:text-lg">نیاز به مشاوره در خرید دارید؟</h4>
            <p className="text-xs sm:text-sm text-cream/80 mt-0.5">کارشناسان ژرکا آماده راهنمایی شما در انتخاب بهترین محصول هستند.</p>
          </div>
        </div>
        <Link
          to={ROUTES.shop}
          className="shrink-0 rounded-full bg-cream text-espresso px-5 py-2.5 text-xs font-bold hover:bg-white active:scale-95 transition-all shadow-sm"
        >
          مشاوره و پشتیبانی
        </Link>
      </div>

      {/* Related products showcase */}
      {(relatedData?.items?.length ?? 0) > 1 && (
        <div className="mt-20 md:mt-24">
          <Reveal className="mb-8 md:mb-10 text-start">
            <p className="eyebrow" dir="ltr">
              CURATED SELECTION
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-ink md:text-3xl">
              محصولات مشابه و مکمل
            </h2>
          </Reveal>
          <ProductGrid
            products={(relatedData?.items ?? [])
              .filter((p) => (p._id || p.id) !== productId)
              .slice(0, 4)}
            columns="grid-cols-2 lg:grid-cols-4"
          />
        </div>
      )}
    </div>
  );
}

/** Fetches related products once the main product is known; skips quietly on error. */
function useRelated(product) {
  const categoryId = product?.categoryId;
  const enabled = Boolean(product);
  return useQuery({
    queryKey: ['jerka', 'related', categoryId ?? product?._id ?? product?.id].filter(Boolean),
    queryFn: () =>
      searchProducts({ categoryId: categoryId || undefined, limit: 8 }).catch(() => ({ items: [] })),
    enabled,
    staleTime: 120000,
  });
}
