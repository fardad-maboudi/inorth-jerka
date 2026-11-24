import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Lock,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatMoney, formatNumber } from '@/lib/money';
import { ROUTES, productRoute } from '@/lib/routes';
import { useProducts } from '@/api/plugins/ecommerce';
import ProductCard from '@/components/ProductCard';
import { resolveProductMedia } from '@/lib/product-media';
import { EASE } from '@/lib/motion';

export default function Cart() {
  const {
    items,
    subtotal,
    discount,
    tax,
    shippingCost,
    total,
    currency,
    couponCode,
    loading,
    count,
    update,
    remove,
    clear,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Recommendations query
  const { data: recommendedProducts = [] } = useProducts({ limit: 4 });

  const fmt = (n) => formatMoney(n, currency);

  async function handleApply(e) {
    e.preventDefault();
    if (!code.trim() || couponBusy) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      await applyCoupon(code.trim());
      setCode('');
    } catch (err) {
      setCouponError(err?.message || 'کد تخفیف اعمال نشد.');
    } finally {
      setCouponBusy(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponError('');
    try {
      await removeCoupon();
    } catch {
      /* keep the badge; server state unchanged */
    }
  }

  async function handleClearCart() {
    if (window.confirm('آیا از خالی کردن تمام سبد خرید اطمینان دارید؟')) {
      setIsClearing(true);
      try {
        if (typeof clear === 'function') {
          await clear();
        } else {
          for (const item of items) {
            await remove(item.productId);
          }
        }
      } finally {
        setIsClearing(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper pb-24 pt-8">
        <div className="container-max section-padding">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-2xl bg-sand/60" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-5 rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs"
                >
                  <div className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-sand/50" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-1/2 animate-pulse rounded-full bg-sand/60" />
                    <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-sand/40" />
                    <div className="h-8 w-28 animate-pulse rounded-xl bg-sand/50 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-paper pb-24 pt-6 sm:pt-8">
        <div className="container-max">
          {/* Breadcrumb */}
          <nav aria-label="مسیر صفحه" className="mb-6 text-xs text-muted">
            <ol className="flex items-center flex-wrap gap-2">
              <li>
                <Link to={ROUTES.home} className="transition-colors hover:text-brand-600">
                  خانه
                </Link>
              </li>
              <li aria-hidden className="text-saffron">
                <ChevronLeft size={13} />
              </li>
              <li className="font-semibold text-ink">سبد خرید</li>
            </ol>
          </nav>

          {/* Empty Card Container */}
          <div className="mx-auto max-w-2xl rounded-3xl bg-card border border-line/70 p-8 sm:p-14 text-center shadow-sm my-8">
            <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-sand/60 text-brand-600 border border-line/60 shadow-2xs">
              <ShoppingBag size={34} strokeWidth={1.4} />
            </span>
            <h1 className="mt-6 font-heading text-2xl sm:text-3xl font-bold text-ink">
              سبد خرید شما در حال حاضر خالی است
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted max-w-md mx-auto">
              هنوز اثری به سبد خود اضافه نکرده‌اید. با گشت‌وگذار در میان دست‌چین‌ها و آثار هنری ژرکا، وسایل خاص خانه خود را انتخاب کنید.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.shop}
                className="btn-primary rounded-2xl py-3.5 px-8 text-sm font-heading font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>مشاهده فروشگاه ژرکا</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>

          {/* Recommended Curated Section */}
          {recommendedProducts.length > 0 && (
            <div className="mt-16 sm:mt-20">
              <div className="mb-8 text-start">
                <p className="eyebrow" dir="ltr">
                  POPULAR CREATIONS
                </p>
                <h2 className="mt-1.5 font-heading text-xl sm:text-2xl font-bold text-ink">
                  محبوب‌ترین کالاهای فروشگاه
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {recommendedProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24 pt-6 sm:pt-8">
      <div className="container-max">
        {/* Breadcrumb Trail */}
        <nav aria-label="مسیر صفحه" className="mb-6 text-xs text-muted">
          <ol className="flex items-center flex-wrap gap-2">
            <li>
              <Link to={ROUTES.home} className="transition-colors hover:text-brand-600">
                خانه
              </Link>
            </li>
            <li aria-hidden className="text-saffron">
              <ChevronLeft size={13} />
            </li>
            <li>
              <Link to={ROUTES.shop} className="transition-colors hover:text-brand-600">
                فروشگاه
              </Link>
            </li>
            <li aria-hidden className="text-saffron">
              <ChevronLeft size={13} />
            </li>
            <li className="font-semibold text-ink">سبد خرید</li>
          </ol>
        </nav>

        {/* Page Header */}
        <header className="mb-8 sm:mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow" dir="ltr">
              JERKA SHOPPING BAG
            </p>
            <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-ink">
              سبد خرید شما
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              شما {formatNumber(count)} قلم کالا برای سفارش آماده کرده‌اید.
            </p>
          </div>

          {/* Quick Clear Button */}
          <button
            type="button"
            onClick={handleClearCart}
            disabled={isClearing}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-state-error-ink transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
          >
            <Trash2 size={14} strokeWidth={1.6} />
            <span>خالی کردن سبد</span>
          </button>
        </header>

        {/* 2-Column Responsive Layout */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          {/* Main Column: Items List */}
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const { image: fallbackImg } = resolveProductMedia({
                  ...item,
                  id: item.productId,
                  slug: item.slug || item.productId,
                });
                const displayImage = fallbackImg || item.image;

                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-3xl bg-card border border-line/70 p-4 sm:p-5 md:p-6 shadow-xs hover:border-brand-400/50 hover:shadow-sm transition-all duration-200 items-stretch sm:items-center"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={productRoute(item.productId)}
                      className="size-24 sm:size-28 md:size-30 shrink-0 overflow-hidden rounded-2xl bg-sand/35 border border-line/60 shadow-2xs block relative group-hover:border-brand-400/60 transition-colors"
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={item.title || ''}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(120%_120%_at_20%_0%,#f3e6d5,#d7cdba)]" />
                      )}
                    </Link>

                  {/* Details Middle */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={productRoute(item.productId)}
                          className="font-heading text-base sm:text-lg font-bold text-ink hover:text-brand-600 transition-colors line-clamp-1"
                        >
                          {item.title || item.productId}
                        </Link>
                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          aria-label={`حذف ${item.title || 'کالا'}`}
                          className="size-8 shrink-0 rounded-xl text-muted/70 hover:text-state-error-ink hover:bg-rose-50 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.6} />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                        <span className="font-heading">
                          قیمت واحد: {fmt(item.unitPrice)}
                        </span>
                        <span className="text-line">•</span>
                        <span className="text-brand-700 font-medium bg-brand-50 border border-brand-200/50 rounded-full px-2 py-0.5 text-[10px]">
                          آماده ارسال
                        </span>
                      </div>
                    </div>

                    {/* Bottom Controls: Stepper + Line Total */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line/40">
                      {/* Tactile Stepper */}
                      <div className="inline-flex items-center rounded-2xl border border-line/80 bg-paper/70 p-1 shadow-2xs">
                        <button
                          type="button"
                          aria-label="کاهش تعداد"
                          onClick={() =>
                            item.qty <= 1 ? remove(item.productId) : update(item.productId, item.qty - 1)
                          }
                          className="size-8 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-card active:scale-90 transition-all cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={2} />
                        </button>
                        <span className="w-10 text-center font-heading font-bold text-sm tabular-nums text-ink">
                          {formatNumber(item.qty)}
                        </span>
                        <button
                          type="button"
                          aria-label="افزایش تعداد"
                          onClick={() => update(item.productId, item.qty + 1)}
                          className="size-8 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-card active:scale-90 transition-all cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-end">
                        <p className="font-heading text-lg sm:text-xl font-black text-ink">
                          {fmt(item.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>

            {/* Back to Shop Link */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                to={ROUTES.shop}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-brand-700 hover:text-brand-800 transition-colors py-2"
              >
                <ArrowLeft size={16} className="rotate-180" />
                <span>ادامه خرید و بررسی کالاهای بیشتر</span>
              </Link>
            </div>

            {/* Trust Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6">
              <div className="rounded-2xl border border-line/70 bg-card p-4 flex items-center gap-3 shadow-2xs">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/60 text-brand-600">
                  <ShieldCheck size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h4 className="font-heading text-xs font-bold text-ink">ضمانت اصالت</h4>
                  <p className="text-[11px] text-muted">تضمین کیفیت و اصالت فیزیکی</p>
                </div>
              </div>

              <div className="rounded-2xl border border-line/70 bg-card p-4 flex items-center gap-3 shadow-2xs">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/60 text-brand-600">
                  <Truck size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h4 className="font-heading text-xs font-bold text-ink">ارسال ایمن</h4>
                  <p className="text-[11px] text-muted">بسته‌بندی ویژه و محافظت‌شده</p>
                </div>
              </div>

              <div className="rounded-2xl border border-line/70 bg-card p-4 flex items-center gap-3 shadow-2xs">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/60 text-brand-600">
                  <RefreshCcw size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h4 className="font-heading text-xs font-bold text-ink">بازگشت کالا</h4>
                  <p className="text-[11px] text-muted">۷ روز ضمانت تعویض یا عودت</p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Column: Order Summary Sidebar (Sticky) */}
          <aside className="rounded-3xl bg-sand/40 border border-line/70 p-6 sm:p-7 shadow-sm space-y-6 lg:sticky lg:top-28 backdrop-blur-xs">
            <div className="flex items-center justify-between pb-1 border-b border-line/50">
              <h2 className="font-heading text-lg font-bold text-ink">خلاصه سفارش</h2>
              <span className="text-xs font-heading text-muted">
                {formatNumber(count)} کالا
              </span>
            </div>

            {/* Coupon Code Section */}
            <div>
              <form onSubmit={handleApply} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="کد تخفیف داری؟"
                    aria-label="کد تخفیف"
                    className="w-full rounded-2xl border border-line/80 bg-card px-4 py-2.5 text-xs sm:text-sm placeholder:text-muted/60 focus:border-brand-600 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={couponBusy || !code.trim()}
                  className="rounded-2xl bg-espresso hover:bg-brand-600 disabled:opacity-40 text-cream px-4 py-2.5 text-xs font-heading font-bold transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
                >
                  {couponBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'اعمال کد'
                  )}
                </button>
              </form>

              {couponError && (
                <p className="mt-2 text-xs text-state-error-ink font-medium">
                  {couponError}
                </p>
              )}

              {couponCode && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-brand-50 border border-brand-200/70 px-3.5 py-2 text-xs text-brand-800 font-heading">
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="text-brand-600" />
                    <span>کد «{couponCode}» فعال شد</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    aria-label="حذف کد تخفیف"
                    className="text-state-error-ink hover:underline font-bold text-xs"
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>

            {/* Subtle Dotted Divider */}
            <div className="rule-dots my-2" />

            {/* Price Calculations */}
            <dl className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted text-xs sm:text-sm">جمع کالاها</dt>
                <dd className="font-heading font-bold text-ink">{fmt(subtotal)}</dd>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-clay font-medium">
                  <dt className="text-xs sm:text-sm">تخفیف سفارش</dt>
                  <dd className="font-heading font-bold">-{fmt(discount)}</dd>
                </div>
              )}

              {tax > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted text-xs sm:text-sm">مالیات بر ارزش افزوده</dt>
                  <dd className="font-heading font-medium text-ink">{fmt(tax)}</dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="text-muted text-xs sm:text-sm">هزینه ارسال</dt>
                <dd className="font-heading text-xs text-muted">
                  {shippingCost > 0 ? fmt(shippingCost) : 'محاسبه در مرحله بعد'}
                </dd>
              </div>

              <div className="border-t border-line/70 pt-4 flex items-center justify-between">
                <dt className="font-heading text-base font-bold text-ink">
                  مبلغ قابل پرداخت
                </dt>
                <dd className="font-heading font-black text-xl sm:text-2xl text-ink">
                  {fmt(total)}
                </dd>
              </div>
            </dl>

            {/* Primary Checkout CTA */}
            <div className="pt-2">
              <Link
                to={ROUTES.checkout}
                className="btn-primary w-full rounded-2xl py-4 font-heading font-bold text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 bg-espresso hover:bg-brand-600 text-cream transition-all"
              >
                <span>ادامه فرآیند خرید و پرداخت</span>
                <ArrowLeft size={18} strokeWidth={2} />
              </Link>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-muted/80 pt-1">
              <Lock size={13} className="text-brand-600 shrink-0" />
              <span>پرداخت امن و رمزنگاری‌شده از درگاه‌های عضو شبکه شاپرک</span>
            </div>
          </aside>
        </div>

        {/* Curated Recommendations Rail */}
        {recommendedProducts.length > 0 && (
          <div className="mt-20 sm:mt-24 pt-10 border-t border-line/70">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow" dir="ltr">
                  DISCOVER MORE
                </p>
                <h3 className="mt-1.5 font-heading text-xl sm:text-2xl font-bold text-ink">
                  شاید به این کالاها هم علاقه‌مند باشید
                </h3>
              </div>
              <Link
                to={ROUTES.shop}
                className="text-xs sm:text-sm font-heading font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                مشاهده همه محصولات ←
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {recommendedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
