import ProductCard from '@/components/ProductCard';

function SkeletonCard() {
  return (
    <div className="animate-pulse flex flex-col justify-between rounded-3xl bg-card p-3 sm:p-3.5 border border-line/60 shadow-sm" aria-hidden>
      {/* 4:5 media tile matching ProductCard */}
      <div className="aspect-4/5 w-full rounded-2xl bg-sand/50" />
      {/* Category & rating placeholders */}
      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-line/60" />
        <div className="h-3 w-12 rounded bg-line/50" />
      </div>
      {/* Title placeholder */}
      <div className="mt-2 space-y-1.5">
        <div className="h-4 w-4/5 rounded bg-line/70" />
        <div className="h-3 w-1/3 rounded bg-line/40" />
      </div>
      {/* Price and circular button placeholder */}
      <div className="mt-4 flex items-end justify-between">
        <div className="h-5 w-24 rounded bg-line/65" />
        <div className="size-10 rounded-full bg-line/50 shrink-0" />
      </div>
    </div>
  );
}

/**
 * Editorial catalog grid:
 * - 4:5 sand-tinted skeletons matching ProductCard geometry (2px radius)
 * - Retains previous items when refetching (no layout shift)
 * - Inline error with explicit retry action
 * - Responsive 2/3/4 column rhythm
 */
export default function ProductGrid({
  products = [],
  loading = false,
  error = null,
  emptyState = null,
  columns = 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  onRetry = null,
}) {
  // Initial loading state (no previous data to display)
  if (loading && (!products || products.length === 0)) {
    return (
      <div className={`grid gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 ${columns}`}>
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state with retry
  if (error && (!products || products.length === 0)) {
    return (
      <div className="border border-line bg-card p-8 sm:p-12 text-center rounded-[2px]">
        <p className="font-heading text-base font-medium text-ink">
          خطا در دریافت محصولات
        </p>
        <p className="mt-2 text-xs leading-6 text-muted max-w-md mx-auto">
          {typeof error === 'string'
            ? error
            : error?.message || 'اتصال به سرور برقرار نشد؛ لطفاً اتصال اینترنت خود را بررسی کنید.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-outline mt-6 px-6 py-2 text-xs"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (!products || !products.length) {
    return emptyState ?? null;
  }

  // Loaded grid with keepPreviousData behavior (subtle opacity while refetching)
  return (
    <div
      className={`grid gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 ${columns} transition-opacity duration-200 ${
        loading ? 'opacity-65 pointer-events-none' : 'opacity-100'
      }`}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product._id || product.id || i}
          product={product}
          index={i}
          priority={i < 4}
        />
      ))}
    </div>
  );
}
