import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Edit3,
  Eye,
  HeartHandshake,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import {
  isValidPhone,
  isValidPostalCode,
  localPhone,
  useOrders,
  useShippingLocations,
} from '@/api/plugins/ecommerce';
import { useCartDrawer } from '@/components/cart-drawer-context';
import {
  IRAN_PROVINCES_FALLBACK,
  makeDefaultAddress,
  removeCustomerAddress,
  removeSavedPiece,
  saveCustomerAddress,
  signInDemo,
  signOut,
  updateCustomerProfile,
  useAtelierStore,
} from '@/lib/atelier-store';
import { useCart } from '@/lib/cart-context';
import { formatMoney, formatNumber } from '@/lib/money';
import { EASE } from '@/lib/motion';
import { productRoute, ROUTES } from '@/lib/routes';

const PROFILE_TABS = [
  { id: 'overview', label: 'پیشخوان حساب', icon: Sparkles },
  { id: 'orders', label: 'سفارش‌های من', icon: Package },
  { id: 'addresses', label: 'دفترچه نشانی‌ها', icon: MapPin },
  { id: 'favorites', label: 'منتخب‌های من', icon: Bookmark },
  { id: 'settings', label: 'اطلاعات و تنظیمات', icon: Settings },
];

const ORDER_STATUS_META = {
  pending: {
    label: 'ثبت‌شده · در انتظار بررسی',
    badge: 'bg-sand text-ink border-line',
    step: 1,
  },
  processing: {
    label: 'در حال آماده‌سازی در کارگاه',
    badge: 'bg-saffron-mist text-brand-800 border-saffron/35',
    step: 2,
  },
  shipped: {
    label: 'تحویل به پیک / پست ویژه',
    badge: 'bg-brand-50 text-brand-700 border-brand-200',
    step: 3,
  },
  delivered: {
    label: 'تحویل شده به مشتری',
    badge: 'bg-moss-mist text-moss-900 border-moss-600/25',
    step: 4,
  },
  cancelled: {
    label: 'لغو شده',
    badge: 'bg-clay-mist text-state-error-ink border-clay/30',
    step: 0,
  },
};

const TRACKING_STEPS = [
  { step: 1, label: 'ثبت سفارش' },
  { step: 2, label: 'آماده‌سازی کارگاه' },
  { step: 3, label: 'ارسال مرسوله' },
  { step: 4, label: 'تحویل نهایی' },
];

function TactileSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-paper/55 px-4 py-3.5">
      <div>
        <p className="font-heading text-xs sm:text-sm font-bold text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
          checked ? 'bg-brand-600' : 'bg-sand-deep'
        }`}
      >
        <span
          aria-hidden="true"
          className={`block size-5 rounded-full bg-card shadow-xs transition-transform duration-200 ${
            checked ? '-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { add } = useCart();
  const { openDrawer } = useCartDrawer();

  const {
    isAuthenticated,
    activeProfileUser: user,
    userAddresses,
    userOrders,
    savedPieces,
  } = useAtelierStore();

  // Optional live server orders when authenticated with a backend session
  const { data: serverOrders } = useOrders({}, { enabled: isAuthenticated });
  const { data: shippingLocations } = useShippingLocations();

  const provinces = useMemo(() => {
    if (Array.isArray(shippingLocations?.provinces) && shippingLocations.provinces.length > 0) {
      return shippingLocations.provinces;
    }
    return IRAN_PROVINCES_FALLBACK;
  }, [shippingLocations]);

  const mergedOrders = useMemo(() => {
    const serverList = Array.isArray(serverOrders) ? serverOrders : [];
    const normalizedServer = serverList.map((ord) => ({
      id: ord._id || ord.id || 'JRK-SRV',
      createdAt: ord.created_at
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(String(ord.created_at)))
        : 'اخیر',
      status: String(ord.fulfillmentStatus || ord.status || 'pending').toLowerCase(),
      paymentMethod: ord.paymentMethod || 'درگاه آنلاین',
      shippingMethod: ord.shipping?.name || 'ارسال استاندارد',
      trackingNumber: ord.trackingNumber || '',
      eta: ord.eta || '',
      currency: ord.currency || 'IRT',
      subtotal: Number(ord.subtotal || ord.total || 0),
      discount: Number(ord.discount || 0),
      shippingCost: Number(ord.shippingCost || 0),
      total: Number(ord.total || 0),
      addressLine: ord.address?.line1 || '',
      city: ord.address?.city || '',
      items: Array.isArray(ord.items) ? ord.items : [],
    }));
    const existingIds = new Set(normalizedServer.map((o) => o.id));
    return [...normalizedServer, ...userOrders.filter((o) => !existingIds.has(o.id))];
  }, [serverOrders, userOrders]);

  const tabParam = searchParams.get('tab') || 'overview';
  const activeTab = PROFILE_TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';

  function selectTab(nextTab) {
    const next = new URLSearchParams(searchParams);
    if (nextTab === 'overview') {
      next.delete('tab');
    } else {
      next.set('tab', nextTab);
    }
    setSearchParams(next, { replace: true });
  }

  // Copy states
  const [copiedKey, setCopiedKey] = useState('');
  function copyText(key, value) {
    if (!value || typeof navigator === 'undefined') return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  }

  // Orders filter & detail modal
  const [orderFilter, setOrderFilter] = useState('all');
  const [inspectedOrder, setInspectedOrder] = useState(null);
  const [reorderingId, setReorderingId] = useState('');

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'active') {
      return mergedOrders.filter((o) => ['pending', 'processing', 'shipped'].includes(o.status));
    }
    if (orderFilter === 'delivered') {
      return mergedOrders.filter((o) => o.status === 'delivered');
    }
    if (orderFilter === 'cancelled') {
      return mergedOrders.filter((o) => o.status === 'cancelled');
    }
    return mergedOrders;
  }, [mergedOrders, orderFilter]);

  const activeShipment = useMemo(
    () =>
      mergedOrders.find((o) => o.status === 'shipped' || o.status === 'processing') ||
      mergedOrders[0] ||
      null,
    [mergedOrders],
  );

  async function handleReorder(order) {
    if (!order?.items?.length || reorderingId) return;
    setReorderingId(order.id);
    try {
      for (const line of order.items) {
        if (line.productId) {
          await add(line.productId, line.qty || 1).catch(() => {});
        }
      }
      openDrawer();
    } finally {
      setReorderingId('');
    }
  }

  // Address modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addrForm, setAddrForm] = useState({
    id: '',
    label: 'منزل',
    name: '',
    phone: '',
    province: 'تهران',
    city: 'تهران',
    line1: '',
    postalCode: '',
    isDefault: false,
  });

  const availableCities = useMemo(() => {
    const found = provinces.find((p) => p.fa === addrForm.province);
    return found?.cities || [];
  }, [provinces, addrForm.province]);

  function openNewAddressModal() {
    setAddressError('');
    setAddrForm({
      id: '',
      label: 'منزل',
      name: user.name || '',
      phone: localPhone(user.phone) || '',
      province: 'تهران',
      city: 'تهران',
      line1: '',
      postalCode: '',
      isDefault: userAddresses.length === 0,
    });
    setAddressModalOpen(true);
  }

  function openEditAddressModal(addr) {
    setAddressError('');
    setAddrForm({
      id: addr.id,
      label: addr.label || 'منزل',
      name: addr.name || '',
      phone: localPhone(addr.phone) || addr.phone || '',
      province: addr.province || 'تهران',
      city: addr.city || 'تهران',
      line1: addr.line1 || '',
      postalCode: addr.postalCode || '',
      isDefault: Boolean(addr.isDefault),
    });
    setAddressModalOpen(true);
  }

  function handleSaveAddress(e) {
    e.preventDefault();
    setAddressError('');
    if (!addrForm.name.trim()) {
      setAddressError('نام تحویل‌گیرنده را وارد کنید.');
      return;
    }
    if (!isValidPhone(addrForm.phone)) {
      setAddressError('شماره تماس معتبر وارد کنید (نمونه: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }
    if (!addrForm.line1.trim()) {
      setAddressError('نشانی دقیق پستی را وارد کنید.');
      return;
    }
    if (addrForm.postalCode && !isValidPostalCode(addrForm.postalCode)) {
      setAddressError('کد پستی باید ۱۰ رقم معتبر پستی ایران باشد (رقم‌های اول بدون ۰ و ۲).');
      return;
    }
    saveCustomerAddress(addrForm);
    setAddressModalOpen(false);
  }

  // Saved pieces add-to-cart state
  const [addingPieceId, setAddingPieceId] = useState('');
  async function handleAddPieceToCart(piece) {
    if (addingPieceId) return;
    setAddingPieceId(piece.id);
    try {
      await add(piece.id, 1).catch(() => {});
      openDrawer();
    } finally {
      setAddingPieceId('');
    }
  }

  // Settings form state (keyed to current user id)
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(() => ({
    userId: user.id,
    name: user.name || '',
    phone: localPhone(user.phone) || '',
    email: user.email || '',
    nationalCode: user.nationalCode || '',
    city: user.city || 'تهران',
    iban: user.iban || '',
    bio: user.bio || '',
    newsletter: user.newsletter !== false,
    smsAlerts: user.smsAlerts !== false,
    vipOffers: user.vipOffers !== false,
  }));

  if (settingsDraft.userId !== user.id) {
    setSettingsDraft({
      userId: user.id,
      name: user.name || '',
      phone: localPhone(user.phone) || '',
      email: user.email || '',
      nationalCode: user.nationalCode || '',
      city: user.city || 'تهران',
      iban: user.iban || '',
      bio: user.bio || '',
      newsletter: user.newsletter !== false,
      smsAlerts: user.smsAlerts !== false,
      vipOffers: user.vipOffers !== false,
    });
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    updateCustomerProfile({
      name: settingsDraft.name.trim() || user.name,
      phone: settingsDraft.phone,
      email: settingsDraft.email.trim(),
      nationalCode: settingsDraft.nationalCode.trim(),
      city: settingsDraft.city.trim(),
      iban: settingsDraft.iban.trim(),
      bio: settingsDraft.bio.trim(),
      newsletter: settingsDraft.newsletter,
      smsAlerts: settingsDraft.smsAlerts,
      vipOffers: settingsDraft.vipOffers,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2600);
  }

  const defaultAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0] || null;

  const panelMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: EASE },
      };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Moss Hero Band */}
      <section className="bg-moss-band pt-7 pb-12 sm:pt-10 sm:pb-14 text-on-moss">
        <div className="container-max">
          {/* Breadcrumbs */}
          <nav aria-label="مسیر صفحه" className="mb-6 text-xs text-on-moss/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={ROUTES.home} className="transition-colors hover:text-saffron">
                  خانه
                </Link>
              </li>
              <li aria-hidden className="text-saffron">
                <ChevronLeft size={13} />
              </li>
              <li className="font-semibold text-on-moss">حساب کاربری من</li>
            </ol>
          </nav>

          {/* Guest Preview Notice if not explicitly logged in */}
          {!isAuthenticated && (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-saffron/35 bg-on-moss/8 px-4 py-3.5 sm:px-5 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-saffron/20 text-saffron">
                  <User size={17} />
                </span>
                <p className="text-xs sm:text-sm text-on-moss/90">
                  شما در حال مشاهده پیش‌نمایش حساب کاربری نمونه (<strong>{user.name}</strong>) هستید. برای همگام‌سازی شخصی وارد شوید.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => signInDemo('customer')}
                  className="rounded-xl bg-saffron px-3.5 py-2 font-heading text-xs font-bold text-espresso transition-transform active:scale-95 cursor-pointer"
                >
                  فعال‌سازی نشست نمونه
                </button>
                <Link
                  to={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.profile)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-on-moss/25 bg-on-moss/10 px-3.5 py-2 font-heading text-xs font-bold text-on-moss transition-colors hover:bg-on-moss/20"
                >
                  <LogIn size={14} />
                  <span>ورود / ثبت‌نام</span>
                </Link>
              </div>
            </div>
          )}

          {/* Profile Identity & Stat Pills */}
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="grid size-16 sm:size-20 shrink-0 place-items-center rounded-3xl bg-copper-gradient font-heading text-2xl sm:text-3xl font-bold text-cream shadow-md ring-2 ring-on-moss/15">
                {user.name?.slice(0, 1) || 'ژ'}
              </div>
              <div>
                <p className="eyebrow text-saffron!" dir="ltr">
                  JERKA CLIENTELE · PRIVATE ACCOUNT
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-on-moss text-balance">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-saffron/40 bg-saffron/15 px-3 py-1 font-heading text-xs font-bold text-saffron">
                    <Award size={13} />
                    <span>عضو {user.tier || 'ژرکا'}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-on-moss/70">
                  <span dir="ltr">{localPhone(user.phone) || user.phone}</span>
                  {user.city ? ` · ${user.city}` : ''}
                  {user.joinedAt ? ` · عضویت از ${user.joinedAt}` : ''}
                </p>
              </div>
            </div>

            {/* Frosted Glass Stat Pills */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              <div className="rounded-2xl border border-on-moss/14 bg-on-moss/8 px-3.5 py-3 sm:px-5 backdrop-blur-xs">
                <span className="block text-[11px] text-on-moss/65">کل سفارش‌ها</span>
                <strong className="mt-1 block font-heading text-base sm:text-xl font-bold text-on-moss">
                  {formatNumber(mergedOrders.length)} سفارش
                </strong>
              </div>
              <div className="rounded-2xl border border-on-moss/14 bg-on-moss/8 px-3.5 py-3 sm:px-5 backdrop-blur-xs">
                <span className="block text-[11px] text-on-moss/65">امتیاز باشگاه</span>
                <strong className="mt-1 block font-heading text-base sm:text-xl font-bold text-saffron">
                  {formatNumber(user.points || 0)}
                </strong>
              </div>
              <div className="rounded-2xl border border-on-moss/14 bg-on-moss/8 px-3.5 py-3 sm:px-5 backdrop-blur-xs">
                <span className="block text-[11px] text-on-moss/65">اعتبار کیف پول</span>
                <strong className="mt-1 block font-heading text-sm sm:text-base font-bold text-on-moss">
                  {formatMoney(user.walletBalance || 0, 'IRT')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="container-max mt-8 sm:mt-10 grid items-start gap-8 lg:grid-cols-[290px_1fr]">
        {/* Layered Sand Sidebar (design.md §5.2 & §8.7) */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <aside
            aria-label="منوی حساب کاربری"
            className="rounded-3xl border border-line/70 bg-sand/75 p-5 shadow-sm space-y-2"
          >
            {PROFILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const badgeCount =
                tab.id === 'orders'
                  ? mergedOrders.length
                  : tab.id === 'addresses'
                    ? userAddresses.length
                    : tab.id === 'favorites'
                      ? savedPieces.length
                      : null;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 font-heading text-xs sm:text-sm font-bold transition-[background-color,color,transform] duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-espresso text-cream shadow-xs'
                      : 'bg-card/85 text-ink hover:bg-card'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                      className={active ? 'text-saffron' : 'text-brand-600'}
                    />
                    <span>{tab.label}</span>
                  </span>
                  {badgeCount != null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? 'bg-on-espresso/15 text-cream' : 'bg-sand text-muted'
                      }`}
                    >
                      {formatNumber(badgeCount)}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="rule-dots my-3" />

            <Link
              to={ROUTES.admin}
              className="flex w-full items-center justify-between rounded-2xl border border-line/70 bg-card/85 px-4 py-3 font-heading text-xs font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard size={16} className="text-brand-600" />
                <span>داشبورد مدیریت فروشگاه</span>
              </span>
              <ArrowLeft size={14} />
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate(ROUTES.login);
                }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 font-heading text-xs font-bold text-state-error-ink transition-colors hover:bg-clay-mist active:scale-[0.98] cursor-pointer"
              >
                <LogOut size={16} />
                <span>خروج از حساب کاربری</span>
              </button>
            ) : (
              <Link
                to={ROUTES.login}
                className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 font-heading text-xs font-bold text-brand-700 transition-colors hover:bg-card"
              >
                <LogIn size={16} />
                <span>صفحه ورود و ثبت‌نام</span>
              </Link>
            )}
          </aside>

          {/* Editorial Copper Concierge Card */}
          <div className="rounded-3xl bg-copper-gradient p-6 text-cream shadow-md">
            <div className="flex items-center gap-2 text-xs font-medium text-cream/85">
              <HeartHandshake size={16} />
              <span>مشاوره اختصاصی چیدمان</span>
            </div>
            <h3 className="mt-2 font-heading text-base font-bold text-cream text-balance">
              نیاز به راهنمایی برای هماهنگی رنگ و بافت با فضای خانه‌تان دارید؟
            </h3>
            <p className="mt-2 text-xs leading-6 text-cream/85">
              طراحان داخلی آتلیه ژرکا به صورت رایگان برای اعضای باشگاه پیشنهاد اختصاصی آماده می‌کنند.
            </p>
            <Link
              to={ROUTES.shop}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-espresso/90 px-4 py-2.5 font-heading text-xs font-bold text-cream transition-colors hover:bg-espresso active:scale-[0.98]"
            >
              <span>کاوش در کلکسیون فصل</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="min-w-0">
          {/* ==============================================================
              TAB 1: OVERVIEW
              ============================================================== */}
          {activeTab === 'overview' && (
            <motion.div key="overview" {...panelMotion} className="space-y-6">
              {/* Active Order Shipment Tracker */}
              {activeShipment && (
                <section className="rounded-3xl border border-line/70 bg-card p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-sand/70 text-brand-600">
                          <Truck size={17} />
                        </span>
                        <h2 className="font-heading text-lg font-bold text-ink">
                          وضعیت آخرین سفارش شما
                        </h2>
                      </div>
                      <p className="mt-1.5 text-xs text-muted">
                        کد سفارش:{' '}
                        <strong className="font-heading text-ink" dir="ltr">
                          {activeShipment.id}
                        </strong>
                        {' · '}
                        ثبت در {activeShipment.createdAt}
                        {activeShipment.eta ? ` · ${activeShipment.eta}` : ''}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3.5 py-1 font-heading text-xs font-bold ${
                        (ORDER_STATUS_META[activeShipment.status] || ORDER_STATUS_META.pending)
                          .badge
                      }`}
                    >
                      {(ORDER_STATUS_META[activeShipment.status] || ORDER_STATUS_META.pending).label}
                    </span>
                  </div>

                  {/* 4-Step Pipeline */}
                  <div className="mt-7 grid grid-cols-4 gap-2 sm:gap-4">
                    {TRACKING_STEPS.map((st) => {
                      const currentStep =
                        (ORDER_STATUS_META[activeShipment.status] || ORDER_STATUS_META.pending)
                          .step;
                      const done = currentStep >= st.step;
                      const current = currentStep === st.step;
                      return (
                        <div key={st.step} className="flex flex-col items-center text-center">
                          <div
                            className={`grid size-9 sm:size-10 place-items-center rounded-full border font-heading text-xs font-bold transition-colors ${
                              done
                                ? current
                                  ? 'border-brand-600 bg-brand-600 text-cream ring-4 ring-brand-100'
                                  : 'border-moss-800 bg-moss-800 text-on-moss'
                                : 'border-line bg-paper text-muted'
                            }`}
                          >
                            {done && !current ? <Check size={15} /> : formatNumber(st.step)}
                          </div>
                          <span
                            className={`mt-2.5 font-heading text-[11px] sm:text-xs font-bold ${
                              done ? 'text-ink' : 'text-muted'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracking Number & Action */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>کد رهگیری مرسوله:</span>
                      {activeShipment.trackingNumber ? (
                        <button
                          type="button"
                          onClick={() => copyText('tracking', activeShipment.trackingNumber)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-2.5 py-1 font-mono text-xs text-ink hover:border-brand-600 cursor-pointer"
                          dir="ltr"
                        >
                          <span>{activeShipment.trackingNumber}</span>
                          {copiedKey === 'tracking' ? (
                            <Check size={12} className="text-moss-800" />
                          ) : (
                            <Copy size={12} className="text-muted" />
                          )}
                        </button>
                      ) : (
                        <span className="text-ink font-medium">پس از تحویل به پست درج می‌شود</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectedOrder(activeShipment)}
                      className="inline-flex items-center gap-1.5 font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                    >
                      <span>مشاهده فاکتور و اقلام سفارش</span>
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                </section>
              )}

              {/* Loyalty & Personal Reward Banner */}
              <section className="rounded-3xl bg-espresso-band p-6 sm:p-7 text-on-espresso shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-lg">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron">
                      <Wallet size={15} />
                      <span>باشگاه وفاداری مشتریان ژرکا</span>
                    </div>
                    <h3 className="mt-2 font-heading text-xl font-bold text-on-espresso text-balance">
                      کد هدیه اختصاصی فصل شما فعال است
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-7 text-on-espresso/75">
                      هنگام ثبت سفارش بعدی در سبد خرید، از کد اختصاصی خود برای کسر تخفیف باشگاه استفاده کنید.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="rounded-2xl border border-on-espresso/15 bg-on-espresso/8 px-4 py-3 text-center">
                      <span className="block text-[10px] text-on-espresso/60">کد اختصاصی عضویت</span>
                      <strong className="mt-0.5 block font-mono text-sm font-bold text-saffron" dir="ltr">
                        {user.rewardCode || 'JERKA1405'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText('reward', user.rewardCode || 'JERKA1405')}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-3.5 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-700 active:scale-95 cursor-pointer"
                    >
                      {copiedKey === 'reward' ? (
                        <>
                          <Check size={14} />
                          <span>کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>کپی کد</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              {/* 2-Card Quick Summary Row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Default Address Card */}
                <div className="flex flex-col justify-between rounded-3xl border border-line/70 bg-card p-6 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-bold text-ink">
                        نشانی پیش‌فرض ارسال
                      </h3>
                      <button
                        type="button"
                        onClick={() => selectTab('addresses')}
                        className="font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                      >
                        مدیریت نشانی‌ها ←
                      </button>
                    </div>

                    {defaultAddress ? (
                      <div className="mt-4 rounded-2xl border border-line/60 bg-paper/65 p-4 text-xs leading-7 text-muted">
                        <div className="flex items-center justify-between">
                          <strong className="font-heading text-sm text-ink">
                            {defaultAddress.label}
                          </strong>
                          <span className="rounded-full bg-moss-mist px-2.5 py-0.5 text-[10px] font-bold text-moss-900">
                            پیش‌فرض
                          </span>
                        </div>
                        <p className="mt-1.5 text-ink">
                          {defaultAddress.province}، {defaultAddress.city} — {defaultAddress.line1}
                        </p>
                        <p className="mt-1 text-[11px]">
                          گیرنده: {defaultAddress.name} ·{' '}
                          <span dir="ltr">{localPhone(defaultAddress.phone)}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-muted">
                        هنوز نشانی منتخبی ذخیره نکرده‌اید.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      selectTab('addresses');
                      openNewAddressModal();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>افزودن نشانی تازه</span>
                  </button>
                </div>

                {/* Personal Profile Card */}
                <div className="flex flex-col justify-between rounded-3xl border border-line/70 bg-card p-6 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-bold text-ink">
                        مشخصات فردی شما
                      </h3>
                      <button
                        type="button"
                        onClick={() => selectTab('settings')}
                        className="font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                      >
                        ویرایش مشخصات ←
                      </button>
                    </div>

                    <dl className="mt-4 space-y-2.5 rounded-2xl border border-line/60 bg-paper/65 p-4 text-xs">
                      <div className="flex items-center gap-3">
                        <dt className="min-w-24 text-muted">نام کامل:</dt>
                        <dd className="font-heading font-bold text-ink">{user.name}</dd>
                      </div>
                      <div className="flex items-center gap-3">
                        <dt className="min-w-24 text-muted">شماره همراه:</dt>
                        <dd className="font-medium text-ink" dir="ltr">
                          {localPhone(user.phone) || user.phone}
                        </dd>
                      </div>
                      <div className="flex items-center gap-3">
                        <dt className="min-w-24 text-muted">پست الکترونیک:</dt>
                        <dd className="font-medium text-ink" dir="ltr">
                          {user.email || 'ثبت نشده'}
                        </dd>
                      </div>
                      <div className="flex items-center gap-3">
                        <dt className="min-w-24 text-muted">شماره شبا:</dt>
                        <dd className="truncate font-mono text-[11px] text-ink" dir="ltr">
                          {user.iban || 'ثبت نشده'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
                    <ShieldCheck size={14} className="text-brand-600 shrink-0" />
                    <span>اطلاعات هویتی و بانکی شما نزد ژرکا محرمانه است.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              TAB 2: ORDERS & TRACKING
              ============================================================== */}
          {activeTab === 'orders' && (
            <motion.div key="orders" {...panelMotion} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
                    تاریخچه سفارش‌ها و مرسولات
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    جزئیات فاکتور، وضعیت بسته‌بندی در کارگاه و کد رهگیری مرسوله‌ها را مشاهده کنید.
                  </p>
                </div>

                {/* Status Filter Segmented Bar */}
                <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line/70 bg-sand/70 p-1">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'active', label: 'در جریان' },
                    { id: 'delivered', label: 'تحویل شده' },
                    { id: 'cancelled', label: 'لغو شده' },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setOrderFilter(flt.id)}
                      className={`rounded-xl px-3.5 py-2 font-heading text-xs font-bold transition-colors cursor-pointer ${
                        orderFilter === flt.id
                          ? 'bg-espresso text-cream shadow-2xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-3xl border border-line/70 bg-card p-12 text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-sand/60 text-brand-600">
                    <Package size={28} strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold text-ink">
                    سفارشی در این بخش یافت نشد
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted">
                    برای مشاهده آثار دست‌ساز فصل جدید به فروشگاه سر بزنید.
                  </p>
                  <Link
                    to={ROUTES.shop}
                    className="btn-primary mt-6 rounded-2xl px-6 py-3 font-heading text-xs font-bold"
                  >
                    <span>مشاهده فروشگاه ژرکا</span>
                    <ArrowLeft size={15} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
                    return (
                      <article
                        key={order.id}
                        className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs transition-colors hover:border-brand-400/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <strong className="font-heading text-sm sm:text-base font-bold text-ink" dir="ltr">
                              {order.id}
                            </strong>
                            <span className="text-xs text-muted">• {order.createdAt}</span>
                            <span
                              className={`rounded-full border px-3 py-0.5 font-heading text-[11px] font-bold ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <div className="text-end">
                            <span className="text-xs text-muted me-1.5">مبلغ کل:</span>
                            <strong className="font-heading text-base sm:text-lg font-bold text-ink">
                              {formatMoney(order.total, order.currency)}
                            </strong>
                          </div>
                        </div>

                        {/* Item Thumbnails Strip */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            {(order.items || []).map((line, idx) => (
                              <div
                                key={`${line.productId || idx}`}
                                className="flex items-center gap-2.5 rounded-2xl border border-line/60 bg-paper/65 p-2 pe-3.5"
                              >
                                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-sand">
                                  {line.image && (
                                    <img
                                      src={line.image}
                                      alt={line.title || ''}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="max-w-44 truncate font-heading text-xs font-bold text-ink">
                                    {line.title}
                                  </p>
                                  <p className="text-[11px] text-muted">
                                    {formatNumber(line.qty || 1)} عدد ·{' '}
                                    {formatMoney(line.unitPrice || line.lineTotal, order.currency)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Actions */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleReorder(order)}
                              disabled={reorderingId === order.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2.5 font-heading text-xs font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-700 active:scale-95 cursor-pointer"
                            >
                              {reorderingId === order.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              <span>سفارش مجدد</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setInspectedOrder(order)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-espresso px-4 py-2.5 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600 active:scale-95 cursor-pointer"
                            >
                              <Eye size={14} />
                              <span>جزئیات و رهگیری</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ==============================================================
              TAB 3: ADDRESS BOOK
              ============================================================== */}
          {activeTab === 'addresses' && (
            <motion.div key="addresses" {...panelMotion} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
                    دفترچه نشانی‌های منتخب
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    نشانی‌های ذخیره‌شده هنگام تسویه‌حساب با یک کلیک قابل انتخاب هستند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="btn-primary rounded-2xl px-5 py-3 font-heading text-xs sm:text-sm font-bold"
                >
                  <Plus size={16} />
                  <span>افزودن نشانی جدید</span>
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {userAddresses.map((addr) => (
                  <article
                    key={addr.id}
                    className={`flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-colors ${
                      addr.isDefault
                        ? 'border-brand-600/60 bg-card shadow-sm'
                        : 'border-line/70 bg-card shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-xl bg-sand/70 text-brand-600">
                            <MapPin size={16} />
                          </span>
                          <h3 className="font-heading text-base font-bold text-ink">
                            {addr.label || 'نشانی منتخب'}
                          </h3>
                        </div>
                        {addr.isDefault && (
                          <span className="rounded-full bg-moss-mist px-3 py-1 font-heading text-[11px] font-bold text-moss-900 border border-moss-600/20">
                            پیش‌فرض
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-xs sm:text-sm leading-7 text-ink">
                        {addr.province}، {addr.city} — {addr.line1}
                      </p>

                      <dl className="mt-4 space-y-1.5 border-t border-line/50 pt-3 text-xs text-muted">
                        <div className="flex items-center gap-2">
                          <dt className="min-w-20">تحویل‌گیرنده:</dt>
                          <dd className="font-medium text-ink">{addr.name}</dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="min-w-20">شماره تماس:</dt>
                          <dd className="font-medium text-ink" dir="ltr">
                            {localPhone(addr.phone) || addr.phone}
                          </dd>
                        </div>
                        {addr.postalCode && (
                          <div className="flex items-center gap-2">
                            <dt className="min-w-20">کد پستی:</dt>
                            <dd className="font-medium text-ink">
                              {formatNumber(addr.postalCode).replace(/,/g, '')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-4">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => makeDefaultAddress(addr.id)}
                          className="font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                        >
                          تنظیم به عنوان پیش‌فرض
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-moss-800">
                          <PackageCheck size={14} />
                          <span>نشانی فعال تسویه حساب</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(addr)}
                          aria-label={`ویرایش ${addr.label}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-600 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>ویرایش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomerAddress(addr.id)}
                          aria-label={`حذف ${addr.label}`}
                          className="inline-flex items-center justify-center size-8 rounded-xl text-muted transition-colors hover:bg-clay-mist hover:text-state-error-ink cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              TAB 4: CURATED SAVED PIECES
              ============================================================== */}
          {activeTab === 'favorites' && (
            <motion.div key="favorites" {...panelMotion} className="space-y-6">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
                  منتخب‌های من در ژرکا
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  آثاری که برای بررسی دوباره یا تکمیل چیدمان منزل خود نشان کرده‌اید.
                </p>
              </div>

              {savedPieces.length === 0 ? (
                <div className="rounded-3xl border border-line/70 bg-card p-12 text-center">
                  <p className="font-heading text-base font-bold text-ink">
                    فهرست منتخب‌های شما خالی است.
                  </p>
                  <Link
                    to={ROUTES.shop}
                    className="btn-primary mt-5 rounded-2xl px-6 py-3 font-heading text-xs font-bold"
                  >
                    مشاهده فروشگاه
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {savedPieces.map((piece) => (
                    <article
                      key={piece.id}
                      className="flex flex-col justify-between rounded-3xl border border-line/70 bg-card p-3.5 shadow-xs"
                    >
                      <div>
                        <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-sand/35">
                          <img
                            src={piece.image}
                            alt={piece.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="pt-3.5 px-1">
                          <span className="text-xs font-medium text-brand-600">
                            {piece.category}
                          </span>
                          <h3 className="mt-1 font-heading text-sm sm:text-base font-bold text-ink">
                            {piece.title}
                          </h3>
                          <p className="mt-2 font-heading text-base font-bold text-ink">
                            {formatMoney(piece.price, piece.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 pt-2 border-t border-line/50">
                        <button
                          type="button"
                          onClick={() => void handleAddPieceToCart(piece)}
                          disabled={addingPieceId === piece.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-espresso py-2.5 px-3 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600 active:scale-[0.98] cursor-pointer"
                        >
                          {addingPieceId === piece.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ShoppingBag size={14} />
                          )}
                          <span>افزودن به سبد</span>
                        </button>
                        <Link
                          to={productRoute(piece.id)}
                          className="rounded-2xl border border-line bg-paper px-3 py-2.5 font-heading text-xs font-bold text-ink transition-colors hover:border-brand-600"
                        >
                          مشاهده
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeSavedPiece(piece.id)}
                          aria-label={`حذف ${piece.title}`}
                          className="grid size-9 shrink-0 place-items-center rounded-2xl text-muted transition-colors hover:bg-clay-mist hover:text-state-error-ink cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ==============================================================
              TAB 5: ACCOUNT SETTINGS
              ============================================================== */}
          {activeTab === 'settings' && (
            <motion.div key="settings" {...panelMotion}>
              <form
                onSubmit={handleSaveSettings}
                className="rounded-3xl border border-line/70 bg-card p-6 sm:p-8 shadow-xs space-y-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-5">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
                      اطلاعات فردی و ترجیحات ارتباطی
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-muted">
                      اطلاعات ثبت‌شده برای صدور فاکتور رسمی و ارسال اطلاعیه‌های سفارش استفاده می‌شود.
                    </p>
                  </div>
                  {profileSaved && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-mist px-3.5 py-1.5 font-heading text-xs font-bold text-moss-900 border border-moss-600/25">
                      <CheckCircle2 size={14} />
                      <span>تغییرات با موفقیت ذخیره شد</span>
                    </span>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      نام و نام خانوادگی
                    </span>
                    <input
                      type="text"
                      required
                      value={settingsDraft.name}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      شماره تلفن همراه
                    </span>
                    <input
                      type="tel"
                      dir="ltr"
                      value={settingsDraft.phone}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-left text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      پست الکترونیک
                    </span>
                    <input
                      type="email"
                      dir="ltr"
                      value={settingsDraft.email}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-left text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      کد ملی (جهت صدور فاکتور)
                    </span>
                    <input
                      type="text"
                      value={settingsDraft.nationalCode}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, nationalCode: e.target.value }))
                      }
                      placeholder="۱۰ رقم"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      شهر محل سکونت
                    </span>
                    <input
                      type="text"
                      value={settingsDraft.city}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, city: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      شماره شبا (جهت بازگشت وجه سریع)
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      value={settingsDraft.iban}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, iban: e.target.value }))
                      }
                      placeholder="IR000000000000000000000000"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-left font-mono text-xs sm:text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium text-ink">
                      یادداشت سلیقه چیدمان (برای مشاوره اختصاصی ژرکا)
                    </span>
                    <textarea
                      rows={2}
                      value={settingsDraft.bio}
                      onChange={(e) =>
                        setSettingsDraft((d) => ({ ...d, bio: e.target.value }))
                      }
                      className="w-full resize-none rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>
                </div>

                <div className="rule-dots" />

                <div className="space-y-3">
                  <h3 className="font-heading text-sm font-bold text-ink">
                    تنظیمات اطلاع‌رسانی
                  </h3>
                  <TactileSwitch
                    checked={settingsDraft.smsAlerts}
                    onChange={(val) =>
                      setSettingsDraft((d) => ({ ...d, smsAlerts: val }))
                    }
                    label="پیامک لحظه‌ای وضعیت آماده‌سازی و ارسال مرسوله"
                    description="ارسال کد رهگیری تیپاکس و زمان تحویل پیک اختصاصی"
                  />
                  <TactileSwitch
                    checked={settingsDraft.newsletter}
                    onChange={(val) =>
                      setSettingsDraft((d) => ({ ...d, newsletter: val }))
                    }
                    label="خبرنامه کلکسیون‌های فصلی و داستان هنرمندان"
                    description="حداکثر دو ایمیل گزیده در ماه، بدون پیام‌های تبلیغاتی مزاحم"
                  />
                  <TactileSwitch
                    checked={settingsDraft.vipOffers}
                    onChange={(val) =>
                      setSettingsDraft((d) => ({ ...d, vipOffers: val }))
                    }
                    label="دعوت‌نامه نمایشگاه‌های حضوری گالری ژرکا"
                    description="اطلاع از رویدادهای خصوصی تهران و فروش محدود کارگاهی"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-primary rounded-2xl px-8 py-3.5 font-heading text-sm font-bold"
                  >
                    <Check size={16} />
                    <span>ذخیره تغییرات پروفایل</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: ORDER INVOICE & TRACKING INSPECTOR
          ==================================================================== */}
      <AnimatePresence>
        {inspectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setInspectedOrder(null)}
              className="fixed inset-0 bg-espresso/55 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`جزئیات سفارش ${inspectedOrder.id}`}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="eyebrow" dir="ltr">
                    JERKA ORDER INVOICE
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-bold text-ink" dir="ltr">
                    {inspectedOrder.id}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    ثبت‌شده در {inspectedOrder.createdAt} · {inspectedOrder.paymentMethod}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedOrder(null)}
                  aria-label="بستن پنجره"
                  className="grid size-9 place-items-center rounded-full bg-sand/50 text-muted hover:bg-sand hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {(inspectedOrder.items || []).map((item, i) => (
                  <div
                    key={item.productId || i}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line/60 bg-paper/65 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title || ''}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-xs sm:text-sm font-bold text-ink">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          تعداد: {formatNumber(item.qty || 1)} · واحد:{' '}
                          {formatMoney(item.unitPrice, inspectedOrder.currency)}
                        </p>
                      </div>
                    </div>
                    <strong className="shrink-0 font-heading text-xs sm:text-sm font-bold text-ink">
                      {formatMoney(item.lineTotal, inspectedOrder.currency)}
                    </strong>
                  </div>
                ))}
              </div>

              {inspectedOrder.addressLine && (
                <div className="mt-5 rounded-2xl border border-line/60 bg-sand/35 p-4 text-xs leading-6 text-muted">
                  <strong className="font-heading text-ink block mb-1">
                    مقصد و روش ارسال ({inspectedOrder.shippingMethod}):
                  </strong>
                  <p>{inspectedOrder.addressLine}</p>
                  {inspectedOrder.trackingNumber && (
                    <p className="mt-1 text-ink">
                      کد رهگیری: <span dir="ltr">{inspectedOrder.trackingNumber}</span>
                    </p>
                  )}
                </div>
              )}

              <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs sm:text-sm">
                <div className="flex justify-between text-muted">
                  <dt>جمع اقلام</dt>
                  <dd>{formatMoney(inspectedOrder.subtotal, inspectedOrder.currency)}</dd>
                </div>
                {inspectedOrder.discount > 0 && (
                  <div className="flex justify-between text-clay font-medium">
                    <dt>تخفیف باشگاه</dt>
                    <dd>-{formatMoney(inspectedOrder.discount, inspectedOrder.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <dt>هزینه ارسال</dt>
                  <dd>
                    {inspectedOrder.shippingCost > 0
                      ? formatMoney(inspectedOrder.shippingCost, inspectedOrder.currency)
                      : 'رایگان'}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line/70 pt-3 font-heading text-base font-bold text-ink">
                  <dt>مبلغ پرداخت‌شده</dt>
                  <dd>{formatMoney(inspectedOrder.total, inspectedOrder.currency)}</dd>
                </div>
              </dl>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 2: ADD / EDIT ADDRESS
          ==================================================================== */}
      <AnimatePresence>
        {addressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setAddressModalOpen(false)}
              className="fixed inset-0 bg-espresso/55 backdrop-blur-[2px]"
            />
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label="فرم نشانی"
              onSubmit={handleSaveAddress}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h3 className="font-heading text-lg font-bold text-ink">
                  {addrForm.id ? 'ویرایش نشانی منتخب' : 'ثبت نشانی جدید'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  aria-label="بستن"
                  className="grid size-9 place-items-center rounded-full bg-sand/50 text-muted hover:bg-sand hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {addressError && (
                <div className="rounded-2xl border border-clay/40 bg-clay-mist px-4 py-2.5 text-xs font-medium text-state-error-ink">
                  {addressError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">عنوان نشانی</span>
                  <input
                    type="text"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="منزل، محل کار، استودیو…"
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">
                    نام تحویل‌گیرنده <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={addrForm.name}
                    onChange={(e) => setAddrForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">
                    شماره موبایل <span className="text-brand-600">*</span>
                  </span>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="09123456789"
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-left text-sm text-ink focus:border-brand-600 focus:bg-card"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">کد پستی ۱۰ رقمی</span>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={addrForm.postalCode}
                    onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value }))}
                    placeholder="1964938174"
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-left text-sm text-ink focus:border-brand-600 focus:bg-card"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">استان</span>
                  <select
                    value={addrForm.province}
                    onChange={(e) => {
                      const nextProv = e.target.value;
                      const provObj = provinces.find((p) => p.fa === nextProv);
                      setAddrForm((f) => ({
                        ...f,
                        province: nextProv,
                        city: provObj?.cities?.[0] || '',
                      }));
                    }}
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                  >
                    {provinces.map((p) => (
                      <option key={p.fa} value={p.fa}>
                        {p.fa}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink">شهر</span>
                  <select
                    value={addrForm.city}
                    onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-ink">
                    نشانی دقیق پستی <span className="text-brand-600">*</span>
                  </span>
                  <textarea
                    rows={3}
                    required
                    value={addrForm.line1}
                    onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
                    placeholder="خیابان، کوچه، پلاک، طبقه، واحد…"
                    className="w-full resize-none rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                  />
                </label>
              </div>

              <TactileSwitch
                checked={addrForm.isDefault}
                onChange={(val) => setAddrForm((f) => ({ ...f, isDefault: val }))}
                label="استفاده به عنوان نشانی پیش‌فرض ارسال"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="rounded-2xl border border-line px-5 py-2.5 font-heading text-xs font-bold text-muted hover:text-ink cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn-primary rounded-2xl px-6 py-2.5 font-heading text-xs font-bold"
                >
                  ذخیره نشانی
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
