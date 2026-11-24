import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

function ProductCardSkeleton() {
  return (
    <div className="card-home flex flex-col h-full p-2.5 sm:p-3">
      <div className="aspect-4/5 w-full animate-pulse rounded-[5px] bg-sand/80" />
      <div className="mt-3.5 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded-[2px] bg-neutral-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-[2px] bg-neutral-200/70" />
      </div>
      <div className="mt-auto pt-3 hidden h-8 w-full animate-pulse rounded-[4px] bg-neutral-200/50 md:block" />
    </div>
  );
}

/**
 * Editorial horizontal product slider with RTL-aware scroll snapping.
 * - Mobile: 2 cards visible
 * - Desktop: 4 cards visible
 * - Left & Right Chevrons for smooth step navigation
 * - Uniform card height alignment and RTL direction support
 */
export default function ProductSlider({
  products = [],
  loading = false,
  error = null,
  emptyMessage = 'محصولی یافت نشد.',
  controls = null,
  cardVariant = 'homeCard',
}) {
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollBounds = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const scrollLeft = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;

    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft < maxScroll - 10);
  };

  useEffect(() => {
    updateScrollBounds();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [products, loading]);

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector(':scope > div');
    const scrollAmount = firstCard
      ? (firstCard.offsetWidth + 24) * (window.innerWidth < 640 ? 1 : 2)
      : el.clientWidth * 0.75;
    // In RTL, moving forward in reading direction is scrollLeft negative
    el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector(':scope > div');
    const scrollAmount = firstCard
      ? (firstCard.offsetWidth + 24) * (window.innerWidth < 640 ? 1 : 2)
      : el.clientWidth * 0.75;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="rounded-[2px] border border-line bg-card p-8 text-center text-sm text-muted">
        <p>خطا در بارگذاری محصولات: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative group/slider">
      {/* Right Chevron Button (Scrolls back to the right in RTL) */}
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="محصولات قبلی"
        className="absolute right-1 sm:right-2 md:right-3 top-[38%] -translate-y-1/2 z-20 flex size-10 sm:size-11 md:size-12 items-center justify-center rounded-full border border-line/90 bg-card/95 text-ink shadow-lg backdrop-blur-md transition-all duration-200 hover:border-brand-500 hover:bg-card hover:text-brand-700 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none md:disabled:opacity-20 md:disabled:pointer-events-none cursor-pointer disabled:cursor-default"
      >
        <ChevronRight size={22} strokeWidth={2.2} />
      </button>

      {/* Left Chevron Button (Scrolls forward to the left in RTL) */}
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="محصولات بعدی"
        className="absolute left-1 sm:left-2 md:left-3 top-[38%] -translate-y-1/2 z-20 flex size-10 sm:size-11 md:size-12 items-center justify-center rounded-full border border-line/90 bg-card/95 text-ink shadow-lg backdrop-blur-md transition-all duration-200 hover:border-brand-500 hover:bg-card hover:text-brand-700 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none md:disabled:opacity-20 md:disabled:pointer-events-none cursor-pointer disabled:cursor-default"
      >
        <ChevronLeft size={22} strokeWidth={2.2} />
      </button>

      {/* Scroller container */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none [scroll-snap-type:x_mandatory] md:gap-6 items-stretch"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[calc(76%-8px)] shrink-0 [scroll-snap-align:start] sm:w-[calc(46%-12px)] md:w-[calc(34%-14px)] lg:w-[calc(28%-16px)] flex flex-col"
            >
              <ProductCardSkeleton />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="w-full py-12 text-center text-sm text-muted">
            {emptyMessage}
          </div>
        ) : (
          products.map((product, i) => (
            <div
              key={product._id || product.id || i}
              className="w-[calc(76%-8px)] shrink-0 [scroll-snap-align:start] sm:w-[calc(46%-12px)] md:w-[calc(34%-14px)] lg:w-[calc(28%-16px)] flex flex-col"
            >
              <ProductCard product={product} index={i} priority={i < 2} variant={cardVariant} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ProductSliderControls({ onPrev, onNext, canPrev = true, canNext = true }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="محصولات قبلی"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink transition-[border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-600 hover:text-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
      >
        <ChevronRight size={18} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="محصولات بعدی"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink transition-[border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-600 hover:text-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
      >
        <ChevronLeft size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
