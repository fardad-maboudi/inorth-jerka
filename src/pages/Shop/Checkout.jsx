import { SandboxBadge } from '@joorchin/site-ui';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Truck, MapPin, Store, User } from 'lucide-react';
import {
  checkout as serverCheckout,
  localPhone,
  redirectToPayment,
  useCheckoutPaymentMethods,
  getShippingMethods,
  getPickupLocations,
} from '@/api/plugins/ecommerce';
import { recordCustomerOrder, useAtelierStore } from '@/lib/atelier-store';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/routes';

const ADDRESS_FIELDS = [
  { key: 'name', label: 'نام و نام خانوادگی', required: true },
  { key: 'phone', label: 'شماره تماس', required: true, type: 'tel' },
  { key: 'province', label: 'استان', required: true },
  { key: 'city', label: 'شهر', required: true },
  { key: 'line1', label: 'نشانی کامل', required: true, textarea: true },
  { key: 'postalCode', label: 'کد پستی', required: false, type: 'text', dir: 'ltr' },
];

const METHOD_ICONS = { pickup: Store, tipax: Truck, iran_post: Truck, manual: Truck };

export default function Checkout() {
  const { data: paymentModes } = useCheckoutPaymentMethods();
  const {
    items,
    subtotal,
    discount,
    tax,
    shippingCost,
    total,
    currency,
    setShipping,
    loading,
  } = useCart();
  const { isAuthenticated, currentUser, userAddresses } = useAtelierStore();
  const navigate = useNavigate();

  const defaultSaved = userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const [address, setAddress] = useState(() =>
    isAuthenticated && defaultSaved
      ? {
          name: defaultSaved.name || currentUser?.name || '',
          phone: localPhone(defaultSaved.phone) || defaultSaved.phone || '',
          province: defaultSaved.province || '',
          city: defaultSaved.city || '',
          line1: defaultSaved.line1 || '',
          postalCode: defaultSaved.postalCode || '',
        }
      : {
          name: currentUser?.name || '',
          phone: localPhone(currentUser?.phone) || '',
          province: '',
          city: '',
          line1: '',
          postalCode: '',
        },
  );
  const [methods, setMethods] = useState([]);
  const [methodId, setMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const addressRef = useRef(address);

  const fmt = (n) => formatMoney(n, currency);

  useEffect(() => {
    let active = true;
    Promise.all([getShippingMethods().catch(() => []), getPickupLocations().catch(() => [])]).then(
      ([m]) => {
        if (!active) return;
        const list = Array.isArray(m) ? m : [];
        setMethods(list);
        if (list[0]) setMethodId(list[0]._id || list[0].id);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  // Shipping re-prices on the server whenever the method or destination changes.
  useEffect(() => {
    if (!methodId) return;
    setShipping(methodId, addressRef.current).catch(() => {});
  }, [methodId]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(key, value) {
    const next = { ...address, [key]: value };
    addressRef.current = next;
    setAddress(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await serverCheckout({
        address,
        customer: { name: address.name, phone: address.phone },
        shippingMethodId: methodId || undefined,
      });
      const { orderId } = result;
      recordCustomerOrder({
        id: orderId,
        customerName: address.name,
        customerPhone: address.phone,
        city: address.city,
        addressLine: `${address.province}، ${address.city} — ${address.line1}`,
        postalCode: address.postalCode,
        currency,
        subtotal,
        discount,
        shippingCost,
        total,
        items,
      });
      if (redirectToPayment(result)) return;
      if (Number(result.total) > 0) throw new Error('درگاه پرداخت در دسترس نیست.');
      navigate(`${ROUTES.orderSuccess}?order=${encodeURIComponent(orderId || '')}`);
    } catch (err) {
      setError(err?.message || 'ثبت سفارش انجام نشد.');
      setSubmitting(false);
    }
  }

  if (!loading && !items.length) {
    return (
      <div className="container-max section-padding text-center">
        <h1 className="font-heading text-2xl font-bold">سبدی برای تسویه وجود ندارد</h1>
        <p className="mt-4 text-sm text-neutral-500">اول چند کالا به سبد اضافه کنید.</p>
        <Link to={ROUTES.shop} className="btn-primary mt-8">
          مشاهده فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="container-max section-padding">
      <header className="mb-10">
        <p className="eyebrow" dir="ltr">Checkout</p>
        <h1 className="mt-4 font-heading text-4xl font-bold md:text-5xl">
          تکمیل سفارش
        </h1>
      </header>

      {/* Account / Saved Addresses Strip */}
      {!isAuthenticated ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-sand/50 px-5 py-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-ink">
            <User size={16} className="text-brand-600 shrink-0" />
            <span>عضو باشگاه ژرکا هستید؟ برای انتخاب سریع نشانی‌های ذخیره‌شده وارد شوید.</span>
          </div>
          <Link
            to={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.checkout)}`}
            className="rounded-xl bg-espresso px-4 py-2 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      ) : (
        userAddresses.length > 0 && (
          <div className="mb-8 rounded-2xl border border-line bg-sand/45 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-heading text-xs sm:text-sm font-bold text-ink">
                انتخاب سریع از نشانی‌های ذخیره‌شده شما ({currentUser?.name})
              </span>
              <Link
                to={`${ROUTES.profile}?tab=addresses`}
                className="font-heading text-xs font-bold text-brand-700 hover:underline"
              >
                مدیریت نشانی‌ها
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {userAddresses.map((saved) => (
                <button
                  key={saved.id}
                  type="button"
                  onClick={() => {
                    const next = {
                      name: saved.name || currentUser?.name || '',
                      phone: localPhone(saved.phone) || saved.phone || '',
                      province: saved.province || '',
                      city: saved.city || '',
                      line1: saved.line1 || '',
                      postalCode: saved.postalCode || '',
                    };
                    addressRef.current = next;
                    setAddress(next);
                  }}
                  className="rounded-xl border border-line bg-card px-3.5 py-2 text-start text-xs transition-colors hover:border-brand-600 cursor-pointer"
                >
                  <strong className="font-heading text-ink">{saved.label}</strong>
                  <span className="ms-1.5 text-muted">
                    ({saved.city} — {saved.line1.slice(0, 28)}…)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {paymentModes?.sandbox && <SandboxBadge />}
      <form onSubmit={handleSubmit} className="grid items-start gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-12">
          {/* Address */}
          <fieldset>
            <legend className="mb-6 flex items-center gap-3 font-heading text-lg font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-espresso font-display text-xs text-on-espresso">۱</span>
              اطلاعات ارسال
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              {ADDRESS_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className={`block ${field.textarea ? 'sm:col-span-2' : ''}`}
                >
                  <span className="mb-2 block text-sm text-neutral-600">
                    {field.label}
                    {field.required && <span className="ms-1 text-brand-600">*</span>}
                  </span>
                  {field.textarea ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      value={address[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full resize-none border border-line bg-card px-4 py-3 text-sm focus:border-brand-600 focus:outline-none"
                    />
                  ) : (
                    <input
                      required={field.required}
                      type={field.type || 'text'}
                      dir={field.dir}
                      value={address[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full border border-line bg-card px-4 py-3 text-sm focus:border-brand-600 focus:outline-none"
                      {...(field.dir === 'ltr' ? { style: { textAlign: 'left' } } : {})}
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Shipping method */}
          <fieldset>
            <legend className="mb-6 flex items-center gap-3 font-heading text-lg font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-espresso font-display text-xs text-on-espresso">۲</span>
              روش ارسال
            </legend>

            {!methods.length ? (
              <p className="border border-dashed border-line px-5 py-6 text-sm leading-7 text-neutral-500">
                روش ارسالی تعریف نشده است؛ پس از ثبت سفارش با شما تماس می‌گیریم.
              </p>
            ) : (
              <div className="space-y-3">
                {methods.map((m) => {
                  const id = m._id || m.id;
                  const Icon = METHOD_ICONS[m.kind] || Truck;
                  const active = methodId === id;
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-4 border p-5 transition-all duration-300 ${
                        active
                          ? 'border-brand-600 bg-brand-50/50'
                          : 'border-line bg-card hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={active}
                        onChange={() => setMethodId(id)}
                        className="peer sr-only"
                      />
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
                          active ? 'bg-brand-600 text-white' : 'bg-paper text-neutral-500'
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{m.name}</span>
                        {m.etaDays != null && (
                          <span className="mt-0.5 block text-xs text-neutral-500">
                            تحویل حدود {m.etaDays.toLocaleString('fa-IR')} روز کاری
                            {(m.carrier || m.service) ? ` · ${m.carrier || m.service}` : ''}
                          </span>
                        )}
                      </span>
                      {m.cost != null && m.cost > 0 && (
                        <span className="font-display text-sm">{fmt(m.cost)}</span>
                      )}
                      {(m.cost === 0 || m.kind === 'pickup') && (
                        <span className="text-xs text-state-success-ink">رایگان</span>
                      )}
                      <span
                        aria-hidden
                        className={`h-4 w-4 shrink-0 rounded-full border transition-all ${
                          active ? 'border-[7px] border-brand-600' : 'border-neutral-300'
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-neutral-400">
              <MapPin size={13} className="mt-1 shrink-0" />
              هزینه نهایی ارسال و مالیات پس از انتخاب مقصد توسط سرور محاسبه می‌شود.
            </p>
          </fieldset>
        </div>

        {/* Summary */}
        <aside className="border border-line bg-card p-8 lg:sticky lg:top-28">
          <h2 className="font-heading text-lg font-semibold">سفارش شما</h2>

          <ul className="mt-6 max-h-64 space-y-4 overflow-y-auto pe-1">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3.5">
                <span className="relative shrink-0">
                  <span className="block h-14 w-12 overflow-hidden bg-neutral-100">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="block h-full w-full bg-[radial-gradient(120%_120%_at_20%_0%,#f3e6d5,#d7cdba)]" />
                    )}
                  </span>
                  <span className="absolute -top-1.5 -end-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-espresso px-1 text-[10px] text-on-espresso">
                    {item.qty.toLocaleString('fa-IR')}
                  </span>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.title || item.productId}</span>
                <span className="shrink-0 text-sm text-neutral-600">{fmt(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-7 space-y-3.5 border-t border-line pt-7 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">جمع کالاها</dt>
              <dd>{fmt(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-state-success-ink">
                <dt>تخفیف</dt>
                <dd>-{fmt(discount)}</dd>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">مالیات</dt>
                <dd>{fmt(tax)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">ارسال</dt>
              <dd>{shippingCost > 0 ? fmt(shippingCost) : '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-4 font-heading text-xl">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{fmt(total)}</dd>
            </div>
          </dl>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-5 border-s-2 border-state-error bg-red-50 px-4 py-3 text-xs leading-6 text-state-error-ink"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-8 w-full justify-center">
            {submitting ? (
              'در حال ثبت سفارش…'
            ) : (
              <>
                <Lock size={15} strokeWidth={1.7} />
                ثبت سفارش و پرداخت
              </>
            )}
          </button>
          <Link to={ROUTES.cart} className="mt-4 block text-center text-xs text-neutral-500 underline underline-offset-4 hover:text-brand-700">
            بازگشت به سبد خرید
          </Link>
        </aside>
      </form>
    </div>
  );
}
