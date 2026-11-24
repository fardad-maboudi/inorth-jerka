import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatMoney, formatNumber } from '@/lib/money';
import { ROUTES, productRoute } from '@/lib/routes';
import { resolveProductMedia } from '@/lib/product-media';
import { EASE } from '@/lib/motion';

/**
 * Editorial mini-cart slide-over. Anchored to the inline-end edge (left in RTL)
 * and slides in with the shared expo-out curve.
 * Body scroll locks while open; Escape key closes.
 */
export default function CartDrawer({ open, onClose }) {
  const {
    items,
    subtotal,
    currency,
    count,
    loading,
    update,
    remove,
  } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 z-40 bg-espresso/50 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="سبد خرید"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.38, ease: EASE }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-[430px] sm:max-w-[450px] flex-col bg-card border-s border-line/80 shadow-2xl"
          >
            {/* Drawer Header */}
            <header className="border-b border-line/70 bg-card/95 backdrop-blur-xs">
              <div className="flex items-center justify-between px-6 py-4 sm:py-5">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-ink">
                    سبد خرید
                  </h2>
                  <span className="rounded-full bg-sand/70 text-brand-700 border border-line/60 px-2.5 py-0.5 text-xs font-heading font-bold tabular-nums">
                    {formatNumber(count)} کالا
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن سبد خرید"
                  className="size-9 rounded-full bg-sand/40 hover:bg-sand text-muted hover:text-ink flex items-center justify-center transition-all duration-150 active:scale-90 border border-line/50 cursor-pointer"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>

              {/* Sub-header Assurance Banner */}
              <div className="bg-sand/30 border-t border-line/40 px-6 py-2 flex items-center gap-2 text-[11px] font-medium text-muted">
                <Truck size={13} className="text-brand-600 shrink-0" />
                <span>ارسال سریع و بسته‌بندی نفیس ژرکا به سراسر کشور</span>
              </div>
            </header>

            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted">
                <div className="size-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                <span className="font-heading">در حال بارگذاری سبد خرید…</span>
              </div>
            ) : !items.length ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="grid size-18 place-items-center rounded-3xl bg-sand/50 text-brand-600 border border-line/60 shadow-2xs">
                  <ShoppingBag size={28} strokeWidth={1.5} />
                </span>
                <div className="space-y-1.5 mt-2">
                  <h3 className="font-heading text-base sm:text-lg font-bold text-ink">
                    سبد خرید شما هنوز خالی است
                  </h3>
                  <p className="text-xs sm:text-sm leading-6 text-muted max-w-xs">
                    مجموعه آثار دست‌ساز و دست‌چین‌های ژرکا را بررسی کنید و خانه خود را بیارایید.
                  </p>
                </div>
                <Link
                  to={ROUTES.shop}
                  onClick={onClose}
                  className="btn-primary mt-2 rounded-2xl py-3 px-6 text-xs sm:text-sm font-heading font-bold shadow-sm"
                >
                  مشاهده فروشگاه
                  <ArrowLeft size={15} />
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <ul className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
                  {items.map((item) => {
                    const { image: fallbackImg } = resolveProductMedia({
                      ...item,
                      id: item.productId,
                      slug: item.slug || item.productId,
                    });
                    const displayImage = fallbackImg || item.image;

                    return (
                      <li
                        key={item.productId}
                        className="group flex gap-3.5 sm:gap-4 p-3 rounded-2xl bg-paper/50 border border-line/70 hover:border-brand-400/50 hover:bg-card transition-all duration-200"
                      >
                        {/* Thumbnail with soft rounded frame */}
                        <Link
                          to={productRoute(item.productId)}
                          onClick={onClose}
                          className="size-20 sm:size-22 shrink-0 rounded-xl overflow-hidden bg-sand/35 border border-line/60 shadow-2xs block relative"
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

                      {/* Content Column */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                        {/* Title & Delete */}
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={productRoute(item.productId)}
                            onClick={onClose}
                            className="font-heading font-bold text-xs sm:text-sm text-ink hover:text-brand-600 transition-colors line-clamp-1"
                          >
                            {item.title || item.productId}
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(item.productId)}
                            aria-label={`حذف ${item.title || 'کالا'}`}
                            className="size-7 shrink-0 rounded-lg text-muted/70 hover:text-state-error-ink hover:bg-rose-50 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                          >
                            <Trash2 size={14} strokeWidth={1.6} />
                          </button>
                        </div>

                        {/* Unit price */}
                        <p className="font-heading text-xs text-muted">
                          قیمت واحد: {formatMoney(item.unitPrice, currency)}
                        </p>

                        {/* Quantity Stepper & Line Total */}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          {/* Tactile Stepper */}
                          <div className="inline-flex items-center rounded-xl border border-line/80 bg-card p-0.5 shadow-2xs">
                            <button
                              type="button"
                              aria-label="کاهش تعداد"
                              onClick={() =>
                                item.qty <= 1
                                  ? remove(item.productId)
                                  : update(item.productId, item.qty - 1)
                              }
                              className="size-6 sm:size-7 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-sand/60 active:scale-90 transition-all cursor-pointer"
                            >
                              <Minus size={12} strokeWidth={2} />
                            </button>
                            <span className="w-6 sm:w-7 text-center font-heading font-bold text-xs sm:text-sm tabular-nums text-ink">
                              {formatNumber(item.qty)}
                            </span>
                            <button
                              type="button"
                              aria-label="افزایش تعداد"
                              onClick={() => update(item.productId, item.qty + 1)}
                              className="size-6 sm:size-7 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-sand/60 active:scale-90 transition-all cursor-pointer"
                            >
                              <Plus size={12} strokeWidth={2} />
                            </button>
                          </div>

                          {/* Line Total */}
                          <span className="font-heading font-black text-sm sm:text-base text-ink">
                            {formatMoney(item.lineTotal, currency)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
                </ul>

                {/* Drawer Footer */}
                <footer className="border-t border-line/80 bg-card p-5 sm:p-6 shadow-lg space-y-4">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs sm:text-sm font-medium text-muted">
                      جمع کالاها
                    </span>
                    <span className="font-heading font-black text-base sm:text-lg text-ink">
                      {formatMoney(subtotal, currency)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={ROUTES.cart}
                      onClick={onClose}
                      className="btn-outline w-full rounded-2xl py-3 text-xs sm:text-sm font-heading font-bold border border-line hover:border-brand-600 hover:text-brand-700 text-ink shadow-2xs text-center flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                    >
                      مشاهده سبد
                    </Link>
                    <Link
                      to={ROUTES.checkout}
                      onClick={onClose}
                      className="btn-primary w-full rounded-2xl py-3 text-xs sm:text-sm font-heading font-bold bg-espresso hover:bg-brand-600 text-cream shadow-md hover:shadow-lg text-center flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                    >
                      تسویه حساب
                    </Link>
                  </div>

                  {/* Micro Trust */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted/80 pt-1">
                    <ShieldCheck size={13} className="text-brand-600 shrink-0" />
                    <span>ضمانت اصالت و امکان بازگشت ۷ روزه سفارش</span>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
