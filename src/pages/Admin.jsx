import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  LayoutDashboard,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  createPluginRecord,
  deletePluginRecord,
  updatePluginRecord,
} from '@/api/joorchin';
import { localPhone, useProducts } from '@/api/plugins/ecommerce';
import {
  adjustProductStock,
  deleteAdminCoupon,
  deleteAdminProduct,
  REVENUE_SERIES,
  saveAdminCoupon,
  saveAdminProduct,
  signInDemo,
  STUDIO_MEDIA_PRESETS,
  toggleAdminCoupon,
  toggleProductActive,
  updateAdminCustomer,
  updateAdminOrder,
  updateStoreSettings,
  useAtelierStore,
} from '@/lib/atelier-store';
import { formatMoney, formatNumber } from '@/lib/money';
import { EASE } from '@/lib/motion';
import { resolveProductMedia } from '@/lib/product-media';
import { ROUTES } from '@/lib/routes';

const ADMIN_SECTIONS = [
  { id: 'overview', label: 'پیشخوان و آمار فروش', icon: LayoutDashboard },
  { id: 'orders', label: 'سفارش‌ها و مرسولات', icon: ShoppingBag },
  { id: 'products', label: 'محصولات و موجودی', icon: Package },
  { id: 'customers', label: 'مشتریان و باشگاه', icon: Users },
  { id: 'settings', label: 'تخفیف‌ها و تنظیمات', icon: Settings },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'در انتظار بررسی', badge: 'bg-sand text-ink border-line' },
  {
    value: 'processing',
    label: 'آماده‌سازی در کارگاه',
    badge: 'bg-saffron-mist text-brand-800 border-saffron/35',
  },
  {
    value: 'shipped',
    label: 'تحویل به پست / پیک',
    badge: 'bg-brand-50 text-brand-700 border-brand-200',
  },
  {
    value: 'delivered',
    label: 'تحویل شده',
    badge: 'bg-moss-mist text-moss-900 border-moss-600/25',
  },
  {
    value: 'cancelled',
    label: 'لغو شده',
    badge: 'bg-clay-mist text-state-error-ink border-clay/30',
  },
];

const CATEGORY_BREAKDOWN = [
  { name: 'نورپردازی و آباژور', share: 34, amount: 198000000, bar: 'bg-brand-600' },
  { name: 'سفال و اشیای دکوراتیو', share: 28, amount: 164000000, bar: 'bg-moss-800' },
  { name: 'منسوجات کتان و پشم', share: 22, amount: 129000000, bar: 'bg-saffron' },
  { name: 'نشیمن، چوب و حصیر', share: 16, amount: 95000000, bar: 'bg-clay' },
];

const PRODUCT_CATEGORIES = [
  'سفال و دکور',
  'نورپردازی',
  'منسوجات',
  'دکور',
  'نشیمن',
  'روایح و شمع',
];

function statusMeta(status) {
  return (
    ORDER_STATUS_OPTIONS.find((s) => s.value === status) || ORDER_STATUS_OPTIONS[0]
  );
}

function AdminSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
        checked ? 'bg-brand-600' : 'bg-sand-deep'
      }`}
    >
      <span
        aria-hidden="true"
        className={`block size-5 rounded-full bg-card shadow-2xs transition-transform duration-200 ${
          checked ? '-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-line bg-card px-4 py-3 text-xs shadow-md"
    >
      <p className="font-heading font-bold text-ink">{label}</p>
      <p className="mt-1 text-brand-700 font-medium">
        فروش: <strong>{formatMoney(row?.revenue || 0, 'IRT')}</strong>
      </p>
      <p className="mt-0.5 text-muted">
        تعداد سفارش: <strong>{formatNumber(row?.orders || 0)} سفارش</strong>
      </p>
    </div>
  );
}

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const {
    currentUser,
    isAdmin,
    users,
    orders,
    products: localProducts,
    coupons,
    storeSettings,
  } = useAtelierStore();

  // Pull live catalog rows if connected to a live Joorchin server
  const { data: serverProducts } = useProducts({ limit: 40 });

  const catalogProducts = useMemo(() => {
    const srv = Array.isArray(serverProducts) ? serverProducts : [];
    const localIds = new Set(localProducts.map((p) => p._id || p.id));
    const extras = srv
      .filter((sp) => {
        const sid = sp._id || sp.id;
        return sid && !localIds.has(sid);
      })
      .map((sp) => {
        const { image } = resolveProductMedia(sp);
        return {
          _id: sp._id || sp.id,
          sku: sp.sku || `SRV-${String(sp._id || sp.id).slice(-4).toUpperCase()}`,
          title: sp.title || 'محصول فروشگاه',
          category:
            sp.category?.title ||
            sp.category?.name ||
            (typeof sp.category === 'string' ? sp.category : 'دکور'),
          price: Number(sp.price) || 0,
          compareAtPrice: sp.compare_at_price ?? sp.compareAtPrice ?? null,
          currency: sp.currency || 'IRT',
          stock: sp.stock != null ? Number(sp.stock) : 8,
          active: sp.active !== false,
          isNew: Boolean(sp.is_new || sp.isNew),
          color: sp.attributes?.color || 'کرم',
          material: sp.attributes?.material || '',
          image,
        };
      });
    return [...localProducts, ...extras];
  }, [localProducts, serverProducts]);

  const sectionParam = searchParams.get('section') || 'overview';
  const activeSection = ADMIN_SECTIONS.some((s) => s.id === sectionParam)
    ? sectionParam
    : 'overview';

  function selectSection(nextId) {
    const next = new URLSearchParams(searchParams);
    if (nextId === 'overview') next.delete('section');
    else next.set('section', nextId);
    setSearchParams(next, { replace: true });
    setMobileNavOpen(false);
  }

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  function notify(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  }

  // Persian Jalali date
  const todayJalali = useMemo(
    () =>
      new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  // KPI computations
  const kpis = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingCount = orders.filter(
      (o) => o.status === 'pending' || o.status === 'processing',
    ).length;
    const avgOrder = validOrders.length ? Math.round(totalRevenue / validOrders.length) : 0;
    const lowStockItems = catalogProducts.filter((p) => Number(p.stock) <= 3);
    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      avgOrder,
      activeProducts: catalogProducts.filter((p) => p.active !== false).length,
      lowStockItems,
    };
  }, [orders, catalogProducts]);

  // Overview chart range
  const [chartRange, setChartRange] = useState('7d');
  const chartData = REVENUE_SERIES[chartRange] || REVENUE_SERIES['7d'];

  // Orders management state
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );
  const [trackingDraft, setTrackingDraft] = useState('');
  const [etaDraft, setEtaDraft] = useState('');

  function openOrderInspector(ord) {
    setSelectedOrderId(ord.id);
    setTrackingDraft(ord.trackingNumber || '');
    setEtaDraft(ord.eta || '');
  }

  const filteredOrders = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        String(ord.id).toLowerCase().includes(q) ||
        String(ord.customerName || '').toLowerCase().includes(q) ||
        String(ord.city || '').toLowerCase().includes(q) ||
        String(ord.customerPhone || '').includes(q)
      );
    });
  }, [orders, orderStatusFilter, globalQuery]);

  // Products management state
  const [stockFilter, setStockFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productDraft, setProductDraft] = useState({
    _id: '',
    sku: '',
    title: '',
    category: 'سفال و دکور',
    price: '1850000',
    compareAtPrice: '',
    stock: '10',
    color: 'کرم',
    material: '',
    image: STUDIO_MEDIA_PRESETS[0].url,
    active: true,
    isNew: true,
  });

  function openCreateProductModal() {
    setProductDraft({
      _id: '',
      sku: `JRK-${Math.floor(200 + Math.random() * 799)}`,
      title: '',
      category: 'سفال و دکور',
      price: '1950000',
      compareAtPrice: '',
      stock: '8',
      color: 'کرم',
      material: 'ساخت دست در کارگاه ژرکا',
      image: STUDIO_MEDIA_PRESETS[0].url,
      active: true,
      isNew: true,
    });
    setProductModalOpen(true);
  }

  function openEditProductModal(prod) {
    setProductDraft({
      _id: prod._id || prod.id,
      sku: prod.sku || '',
      title: prod.title || '',
      category: prod.category || 'سفال و دکور',
      price: String(prod.price || 0),
      compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice) : '',
      stock: String(prod.stock ?? 0),
      color: prod.color || 'کرم',
      material: prod.material || '',
      image: prod.image || STUDIO_MEDIA_PRESETS[0].url,
      active: prod.active !== false,
      isNew: Boolean(prod.isNew),
    });
    setProductModalOpen(true);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!productDraft.title.trim()) return;
    const isEdit = Boolean(productDraft._id);
    const saved = saveAdminProduct(productDraft);
    // Attempt optional server sync when owner session is active
    if (isEdit) {
      updatePluginRecord('ecommerce', 'product', saved._id, {
        title: saved.title,
        price: saved.price,
        stock: saved.stock,
        active: saved.active,
      }).catch(() => {});
    } else {
      createPluginRecord('ecommerce', 'product', {
        title: saved.title,
        price: saved.price,
        currency: saved.currency,
        stock: saved.stock,
        active: saved.active,
        images: [saved.image],
      }).catch(() => {});
    }
    setProductModalOpen(false);
    notify(isEdit ? 'مشخصات محصول به‌روزرسانی شد.' : 'محصول جدید به ویترین ژرکا افزوده شد.');
  }

  function handleRemoveProduct(prod) {
    const id = prod._id || prod.id;
    deleteAdminProduct(id);
    deletePluginRecord('ecommerce', 'product', id).catch(() => {});
    notify(`«${prod.title}» از فهرست حذف شد.`);
  }

  const filteredProducts = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    return catalogProducts.filter((p) => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (stockFilter === 'instock' && Number(p.stock) <= 0) return false;
      if (stockFilter === 'low' && (Number(p.stock) <= 0 || Number(p.stock) > 3)) return false;
      if (stockFilter === 'out' && Number(p.stock) > 0) return false;
      if (!q) return true;
      return (
        String(p.title || '').toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q)
      );
    });
  }, [catalogProducts, catFilter, stockFilter, globalQuery]);

  // Customers CRM state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const enrichedCustomers = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    return users
      .map((u) => {
        const custOrders = orders.filter(
          (o) => o.userId === u.id || (u.phone && o.customerPhone === u.phone),
        );
        const totalSpend = custOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((s, o) => s + (Number(o.total) || 0), 0);
        return {
          ...u,
          orderCount: custOrders.length,
          totalSpend,
        };
      })
      .filter((u) => {
        if (!q) return true;
        return (
          String(u.name || '').toLowerCase().includes(q) ||
          String(u.email || '').toLowerCase().includes(q) ||
          String(u.city || '').toLowerCase().includes(q) ||
          String(u.phone || '').includes(q)
        );
      });
  }, [users, orders, globalQuery]);

  // Coupons & store settings state
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    type: 'percent',
    value: '15',
    maxUses: '50',
  });
  const [settingsForm, setSettingsForm] = useState(() => ({ ...storeSettings }));

  function handleAddCoupon(e) {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    saveAdminCoupon(couponForm);
    setCouponForm({ code: '', title: '', type: 'percent', value: '15', maxUses: '50' });
    notify('کد تخفیف جدید ثبت و فعال شد.');
  }

  function handleSaveStoreSettings(e) {
    e.preventDefault();
    updateStoreSettings(settingsForm);
    notify('تنظیمات ویترین و درگاه‌های فروشگاه ذخیره شد.');
  }

  const sectionTitle =
    ADMIN_SECTIONS.find((s) => s.id === activeSection)?.label || 'پیشخوان مدیریت';

  const panelMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: EASE },
      };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-espresso p-5 text-on-espresso">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-on-espresso/10 pb-5">
          <Link to={ROUTES.home} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-copper-gradient font-heading text-lg font-bold text-cream shadow-sm">
              ژ
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold text-on-espresso">ژرکا</span>
                <span className="rounded-full bg-saffron/20 px-2 py-0.5 font-heading text-[10px] font-bold text-saffron">
                  مدیریت
                </span>
              </div>
              <span
                className="block font-display text-[9px] tracking-[0.35em] text-on-espresso/50"
                dir="ltr"
              >
                ATELIER ADMIN
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="بستن منو"
            className="rounded-xl p-1.5 text-on-espresso/70 hover:text-on-espresso lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="ناوبری پنل مدیریت" className="mt-6 space-y-1.5">
          {ADMIN_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            const badge =
              sec.id === 'orders' && kpis.pendingCount > 0
                ? kpis.pendingCount
                : sec.id === 'products' && kpis.lowStockItems.length > 0
                  ? kpis.lowStockItems.length
                  : null;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => selectSection(sec.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 font-heading text-xs sm:text-sm font-bold transition-[background-color,color,transform] duration-200 active:scale-[0.98] cursor-pointer ${
                  active
                    ? 'bg-brand-600 text-cream shadow-sm'
                    : 'text-on-espresso/75 hover:bg-on-espresso/8 hover:text-on-espresso'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{sec.label}</span>
                </span>
                {badge != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active
                        ? 'bg-espresso/40 text-cream'
                        : sec.id === 'products'
                          ? 'bg-clay text-cream'
                          : 'bg-saffron/25 text-saffron'
                    }`}
                  >
                    {formatNumber(badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Admin Identity & Storefront Links */}
      <div className="space-y-3 border-t border-on-espresso/10 pt-5">
        <div className="flex items-center justify-between rounded-2xl bg-on-espresso/6 p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600/30 font-heading text-xs font-bold text-saffron">
              {(currentUser?.name || 'ف').slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-xs font-bold text-on-espresso">
                {isAdmin ? currentUser?.name : 'فرهاد ستوده'}
              </p>
              <p className="text-[10px] text-on-espresso/55">
                {isAdmin ? 'نشست مدیر ارشد فعال' : 'پیش‌نمایش مدیریتی'}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                signInDemo('admin');
                notify('نشست مدیر ارشد فعال شد.');
              }}
              className="rounded-lg bg-saffron px-2 py-1 font-heading text-[10px] font-bold text-espresso cursor-pointer"
            >
              ورود مدیر
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link
            to={ROUTES.home}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-on-espresso/15 py-2.5 font-heading text-xs font-bold text-on-espresso/85 transition-colors hover:bg-on-espresso/10"
          >
            <Store size={13} />
            <span>ویترین سایت</span>
          </Link>
          <Link
            to={ROUTES.profile}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-on-espresso/15 py-2.5 font-heading text-xs font-bold text-on-espresso/85 transition-colors hover:bg-on-espresso/10"
          >
            <User size={13} />
            <span>پروفایل مشتری</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-espresso/60 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-y-0 start-0 z-10 w-72 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Command Bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/92 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="باز کردن منوی مدیریت"
                className="grid size-10 place-items-center rounded-2xl border border-line bg-card text-ink lg:hidden cursor-pointer"
              >
                <Menu size={19} />
              </button>
              <div>
                <h1 className="font-heading text-base sm:text-xl font-bold text-ink">
                  {sectionTitle}
                </h1>
                <p className="text-[11px] text-muted">{todayJalali} · کارگاه مرکزی تهران</p>
              </div>
            </div>

            <div className="flex flex-1 sm:flex-initial items-center justify-end gap-2.5">
              {/* Global Search */}
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={15}
                  className="pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="جستجو در سفارش، محصول، مشتری…"
                  aria-label="جستجوی سراسری پنل"
                  className="w-full rounded-2xl border border-line bg-card ps-9 pe-3 py-2 text-xs text-ink placeholder:text-muted/60 focus:border-brand-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  selectSection('products');
                  openCreateProductModal();
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-espresso px-3.5 py-2.5 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600 active:scale-95 cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">افزودن محصول</span>
              </button>

              <Link
                to={ROUTES.shop}
                className="hidden md:inline-flex items-center gap-1.5 rounded-2xl border border-line bg-card px-3.5 py-2.5 font-heading text-xs font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                <span>مشاهده فروشگاه</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </header>

        {/* Floating Feedback Toast */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="fixed top-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-moss-600/30 bg-moss-900 px-5 py-3 text-xs font-heading font-bold text-on-moss shadow-lg"
            >
              <CheckCircle2 size={15} className="text-saffron shrink-0" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Body */}
        <div className="flex-1 p-4 sm:p-7 md:p-8 space-y-7">
          {/* ================================================================
              SECTION 1: EXECUTIVE OVERVIEW & ANALYTICS
              ================================================================ */}
          {activeSection === 'overview' && (
            <motion.div key="admin-overview" {...panelMotion} className="space-y-7">
              {/* Executive Moss Banner */}
              <section className="rounded-3xl bg-moss-band p-6 sm:p-8 text-on-moss shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron">
                      <Sparkles size={14} />
                      <span>گزارش لحظه‌ای کارگاه و ویترین آنلاین ژرکا</span>
                    </div>
                    <h2 className="mt-2 font-heading text-xl sm:text-2xl md:text-3xl font-bold text-on-moss text-balance">
                      فروش کلکسیون پاییز ۱۸٫۴٪ بالاتر از هدف ماهانه است.
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-on-moss/75">
                      {formatNumber(kpis.pendingCount)} سفارش در انتظار بسته‌بندی کارگاه و{' '}
                      {formatNumber(kpis.lowStockItems.length)} اثر نیازمند شارژ موجودی هستند.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => selectSection('orders')}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-saffron px-4 py-3 font-heading text-xs font-bold text-espresso transition-transform active:scale-95 cursor-pointer"
                    >
                      <Truck size={15} />
                      <span>مدیریت مرسولات ({formatNumber(kpis.pendingCount)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSection('products')}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-on-moss/25 bg-on-moss/10 px-4 py-3 font-heading text-xs font-bold text-on-moss transition-colors hover:bg-on-moss/18 cursor-pointer"
                    >
                      <Package size={15} />
                      <span>کنترل موجودی کارگاه</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 4 KPI Stat Cards */}
              <section
                aria-label="شاخص‌های کلیدی عملکرد"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">فروش خالص ثبت‌شده</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-sand/75 text-brand-600">
                      <TrendingUp size={17} />
                    </span>
                  </div>
                  <strong className="mt-3 block font-heading text-xl sm:text-2xl font-bold text-ink">
                    {formatMoney(kpis.totalRevenue, 'IRT')}
                  </strong>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-moss-mist px-2.5 py-0.5 text-[11px] font-bold text-moss-900">
                    <ArrowUpRight size={12} />
                    +۱۸٫۴٪ نسبت به دوره قبل
                  </span>
                </div>

                <div className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">کل سفارش‌ها</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-sand/75 text-brand-600">
                      <ShoppingBag size={17} />
                    </span>
                  </div>
                  <strong className="mt-3 block font-heading text-xl sm:text-2xl font-bold text-ink">
                    {formatNumber(kpis.totalOrders)} سفارش
                  </strong>
                  <span className="mt-2 inline-block text-xs text-brand-700 font-medium">
                    {formatNumber(kpis.pendingCount)} سفارش در صف آماده‌سازی
                  </span>
                </div>

                <div className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">میانگین ارزش سبد</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-sand/75 text-brand-600">
                      <Tag size={17} />
                    </span>
                  </div>
                  <strong className="mt-3 block font-heading text-xl sm:text-2xl font-bold text-ink">
                    {formatMoney(kpis.avgOrder, 'IRT')}
                  </strong>
                  <span className="mt-2 inline-block text-xs text-muted">
                    بر پایه سفارش‌های تاییدشده
                  </span>
                </div>

                <div className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">کالاهای فعال ویترین</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-sand/75 text-brand-600">
                      <Package size={17} />
                    </span>
                  </div>
                  <strong className="mt-3 block font-heading text-xl sm:text-2xl font-bold text-ink">
                    {formatNumber(kpis.activeProducts)} اثر
                  </strong>
                  <span
                    className={`mt-2 inline-block text-xs font-medium ${
                      kpis.lowStockItems.length > 0 ? 'text-clay' : 'text-moss-800'
                    }`}
                  >
                    {kpis.lowStockItems.length > 0
                      ? `${formatNumber(kpis.lowStockItems.length)} مورد کم‌موجودی کارگاه`
                      : 'موجودی تمام آثار کامل است'}
                  </span>
                </div>
              </section>

              {/* Revenue Chart + Category Share */}
              <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                {/* Revenue Area Chart */}
                <section className="min-w-0 rounded-3xl border border-line/70 bg-card p-5 sm:p-7 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base sm:text-lg font-bold text-ink">
                        روند درآمد و سفارش‌های فروشگاه
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">
                        مبالغ بر حسب تومان · داده‌های تجمیعی درگاه و کارت‌به‌کارت
                      </p>
                    </div>

                    <div className="flex gap-1 rounded-2xl border border-line/70 bg-sand/70 p-1">
                      {[
                        { id: '7d', label: '۷ روز' },
                        { id: '30d', label: '۳۰ روز' },
                        { id: '6m', label: '۶ ماه' },
                      ].map((rng) => (
                        <button
                          key={rng.id}
                          type="button"
                          onClick={() => setChartRange(rng.id)}
                          className={`rounded-xl px-3 py-1.5 font-heading text-xs font-bold transition-colors cursor-pointer ${
                            chartRange === rng.id
                              ? 'bg-espresso text-cream shadow-2xs'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          {rng.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 h-72 w-full min-w-0" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="jerkaCopperFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a05c2c" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="#a05c2c" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e4ddcf" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#6b6459', fontSize: 12, fontFamily: 'Vazirmatn' }}
                          axisLine={{ stroke: '#e4ddcf' }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(val) => `${formatNumber(Math.round(val / 1000000))} م`}
                          tick={{ fill: '#6b6459', fontSize: 11, fontFamily: 'Vazirmatn' }}
                          axisLine={false}
                          tickLine={false}
                          width={54}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#a05c2c"
                          strokeWidth={2.6}
                          fillOpacity={1}
                          fill="url(#jerkaCopperFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Category Sales Share */}
                <section className="flex flex-col justify-between rounded-3xl border border-line/70 bg-card p-5 sm:p-7 shadow-xs">
                  <div>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-ink">
                      سهم فروش دسته‌بندی‌های ژرکا
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      محبوب‌ترین گروه‌های کالایی در ۳۰ روز گذشته
                    </p>

                    <div className="mt-6 space-y-5">
                      {CATEGORY_BREAKDOWN.map((cat) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-heading font-bold text-ink">{cat.name}</span>
                            <span className="text-muted">
                              {formatNumber(cat.share)}٪ · {formatMoney(cat.amount, 'IRT')}
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand">
                            <div
                              className={`h-full rounded-full ${cat.bar}`}
                              style={{ width: `${cat.share}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-line/70 bg-sand/45 p-4 text-xs leading-6 text-muted">
                    <strong className="font-heading text-ink">پیشنهاد سیستم به کارگاه:</strong>{' '}
                    تقاضا برای دسته «نورپردازی» و «آینه‌های برنجی» رو به افزایش است؛ شارژ موجودی این دو گروه در اولویت قرار گیرد.
                  </div>
                </section>
              </div>

              {/* Recent Orders + Low Stock Alerts */}
              <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
                {/* Latest Orders */}
                <section className="rounded-3xl border border-line/70 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base sm:text-lg font-bold text-ink">
                      آخرین سفارش‌های ثبت‌شده
                    </h3>
                    <button
                      type="button"
                      onClick={() => selectSection('orders')}
                      className="font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                    >
                      مشاهده همه سفارش‌ها ←
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-line text-muted">
                          <th className="py-3 text-start font-medium">کد سفارش</th>
                          <th className="py-3 text-start font-medium">مشتری</th>
                          <th className="py-3 text-start font-medium">مبلغ</th>
                          <th className="py-3 text-start font-medium">وضعیت</th>
                          <th className="py-3 text-end font-medium">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {orders.slice(0, 5).map((ord) => {
                          const st = statusMeta(ord.status);
                          return (
                            <tr key={ord.id} className="hover:bg-paper/60 transition-colors">
                              <td className="py-3.5 font-heading font-bold text-ink" dir="ltr">
                                {ord.id}
                              </td>
                              <td className="py-3.5">
                                <span className="font-medium text-ink">{ord.customerName}</span>
                                <span className="ms-1.5 text-[11px] text-muted">({ord.city})</span>
                              </td>
                              <td className="py-3.5 font-heading font-bold text-ink">
                                {formatMoney(ord.total, ord.currency)}
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`inline-block rounded-full border px-2.5 py-0.5 font-heading text-[11px] font-bold ${st.badge}`}
                                >
                                  {st.label}
                                </span>
                              </td>
                              <td className="py-3.5 text-end">
                                <button
                                  type="button"
                                  onClick={() => openOrderInspector(ord)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-1.5 font-heading text-xs font-bold text-ink hover:border-brand-600 cursor-pointer"
                                >
                                  <Eye size={13} />
                                  <span>بررسی</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Low Stock Workshop Restock */}
                <section className="rounded-3xl border border-line/70 bg-sand/55 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={17} className="text-clay" />
                      <h3 className="font-heading text-base font-bold text-ink">
                        هشدار موجودی کارگاه
                      </h3>
                    </div>
                    <span className="rounded-full bg-clay-mist px-2.5 py-0.5 font-heading text-xs font-bold text-state-error-ink">
                      {formatNumber(kpis.lowStockItems.length)} مورد
                    </span>
                  </div>

                  {kpis.lowStockItems.length === 0 ? (
                    <p className="mt-6 text-xs text-moss-900 font-medium">
                      موجودی تمامی آثار بالای حد مجاز است.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {kpis.lowStockItems.map((item) => {
                        const id = item._id || item.id;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-card p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="size-12 shrink-0 rounded-xl object-cover bg-sand"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-heading text-xs font-bold text-ink">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium text-clay">
                                  {Number(item.stock) === 0
                                    ? 'اتمام موجودی در ویترین'
                                    : `تنها ${formatNumber(item.stock)} عدد باقی‌مانده`}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                adjustProductStock(id, 5);
                                notify(`موجودی «${item.title}» ۵ عدد افزایش یافت.`);
                              }}
                              className="shrink-0 rounded-xl bg-espresso px-3 py-2 font-heading text-[11px] font-bold text-cream transition-colors hover:bg-brand-600 active:scale-95 cursor-pointer"
                            >
                              +۵ شارژ
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {/* ================================================================
              SECTION 2: ORDERS & FULFILLMENT MANAGEMENT
              ================================================================ */}
          {activeSection === 'orders' && (
            <motion.div key="admin-orders" {...panelMotion} className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line/70 bg-sand/60 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: 'همه سفارش‌ها' },
                    ...ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOrderStatusFilter(opt.value)}
                      className={`rounded-xl px-3.5 py-2 font-heading text-xs font-bold transition-colors cursor-pointer ${
                        orderStatusFilter === opt.value
                          ? 'bg-espresso text-cream shadow-2xs'
                          : 'bg-card/85 text-muted hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-heading text-muted px-2">
                  نمایش {formatNumber(filteredOrders.length)} از {formatNumber(orders.length)} سفارش
                </span>
              </div>

              {/* Orders Table Card */}
              <div className="rounded-3xl border border-line/70 bg-card p-4 sm:p-6 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="py-3.5 px-2 text-start font-medium">کد سفارش</th>
                      <th className="py-3.5 px-2 text-start font-medium">خریدار و مقصد</th>
                      <th className="py-3.5 px-2 text-start font-medium">تاریخ ثبت</th>
                      <th className="py-3.5 px-2 text-start font-medium">اقلام</th>
                      <th className="py-3.5 px-2 text-start font-medium">مبلغ کل</th>
                      <th className="py-3.5 px-2 text-start font-medium">وضعیت ارسال</th>
                      <th className="py-3.5 px-2 text-end font-medium">مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filteredOrders.map((ord) => {
                      const st = statusMeta(ord.status);
                      const itemCount = (ord.items || []).reduce(
                        (s, i) => s + (Number(i.qty) || 1),
                        0,
                      );
                      return (
                        <tr key={ord.id} className="hover:bg-paper/60 transition-colors">
                          <td className="py-4 px-2 font-heading font-bold text-ink" dir="ltr">
                            {ord.id}
                          </td>
                          <td className="py-4 px-2">
                            <p className="font-heading font-bold text-ink">{ord.customerName}</p>
                            <p className="text-[11px] text-muted">
                              {ord.city} ·{' '}
                              <span dir="ltr">{localPhone(ord.customerPhone) || ord.customerPhone}</span>
                            </p>
                          </td>
                          <td className="py-4 px-2 text-muted">{ord.createdAt}</td>
                          <td className="py-4 px-2 text-ink">{formatNumber(itemCount)} قلم</td>
                          <td className="py-4 px-2 font-heading font-bold text-ink">
                            {formatMoney(ord.total, ord.currency)}
                          </td>
                          <td className="py-4 px-2">
                            <select
                              aria-label={`تغییر وضعیت سفارش ${ord.id}`}
                              value={ord.status}
                              onChange={(e) => {
                                const nextStatus = e.target.value;
                                updateAdminOrder(ord.id, { status: nextStatus });
                                notify(`وضعیت سفارش ${ord.id} به‌روزرسانی شد.`);
                              }}
                              className={`rounded-full border px-3 py-1 font-heading text-xs font-bold cursor-pointer ${st.badge}`}
                            >
                              {ORDER_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 px-2 text-end">
                            <button
                              type="button"
                              onClick={() => openOrderInspector(ord)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-espresso px-3.5 py-2 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600 active:scale-95 cursor-pointer"
                            >
                              <Truck size={13} />
                              <span>جزئیات و رهگیری</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ================================================================
              SECTION 3: PRODUCTS & INVENTORY CRUD
              ================================================================ */}
          {activeSection === 'products' && (
            <motion.div key="admin-products" {...panelMotion} className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line/70 bg-sand/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'همه کالاها' },
                    { id: 'instock', label: 'موجود' },
                    { id: 'low', label: 'کم‌موجودی (≤ ۳)' },
                    { id: 'out', label: 'ناموجود' },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setStockFilter(flt.id)}
                      className={`rounded-xl px-3.5 py-2 font-heading text-xs font-bold transition-colors cursor-pointer ${
                        stockFilter === flt.id
                          ? 'bg-espresso text-cream'
                          : 'bg-card/85 text-muted hover:text-ink'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}

                  <select
                    aria-label="فیلتر دسته‌بندی"
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="rounded-xl border border-line bg-card px-3 py-2 font-heading text-xs font-bold text-ink"
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="btn-primary rounded-2xl px-5 py-2.5 font-heading text-xs font-bold"
                >
                  <Plus size={15} />
                  <span>تعریف اثر / محصول جدید</span>
                </button>
              </div>

              {/* Products List */}
              <div className="grid gap-4">
                {filteredProducts.map((prod) => {
                  const id = prod._id || prod.id;
                  const out = Number(prod.stock) <= 0;
                  const low = Number(prod.stock) > 0 && Number(prod.stock) <= 3;

                  return (
                    <article
                      key={id}
                      className="flex flex-col gap-4 rounded-3xl border border-line/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-2xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-18 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-line/60 bg-sand">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-sand/75 px-2.5 py-0.5 font-heading text-[11px] font-bold text-brand-700">
                              {prod.category}
                            </span>
                            <span className="font-mono text-[11px] text-muted" dir="ltr">
                              {prod.sku}
                            </span>
                            {prod.isNew && (
                              <span className="rounded-full bg-moss-900 px-2 py-0.5 text-[10px] font-bold text-on-moss">
                                جدید
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1.5 truncate font-heading text-sm sm:text-base font-bold text-ink">
                            {prod.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <strong className="font-heading text-sm text-ink">
                              {formatMoney(prod.price, prod.currency)}
                            </strong>
                            {prod.compareAtPrice > prod.price && (
                              <span className="text-muted line-through">
                                {formatMoney(prod.compareAtPrice, prod.currency)}
                              </span>
                            )}
                            {prod.material && (
                              <span className="text-muted">· {prod.material}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Stock Stepper + Active Toggle + Edit/Delete */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 border-t border-line/50 pt-3 sm:border-t-0 sm:pt-0">
                        {/* Stock Stepper */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-heading font-bold ${
                              out ? 'text-state-error-ink' : low ? 'text-clay' : 'text-muted'
                            }`}
                          >
                            موجودی:
                          </span>
                          <div className="inline-flex items-center rounded-xl border border-line bg-paper p-0.5">
                            <button
                              type="button"
                              aria-label="کاهش موجودی"
                              onClick={() => adjustProductStock(id, -1)}
                              className="grid size-7 place-items-center rounded-lg text-muted hover:bg-card hover:text-ink cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-9 text-center font-heading text-xs font-bold text-ink">
                              {formatNumber(prod.stock)}
                            </span>
                            <button
                              type="button"
                              aria-label="افزایش موجودی"
                              onClick={() => adjustProductStock(id, 1)}
                              className="grid size-7 place-items-center rounded-lg text-muted hover:bg-card hover:text-ink cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Active Switch */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">نمایش:</span>
                          <AdminSwitch
                            checked={prod.active !== false}
                            onChange={() => {
                              toggleProductActive(id);
                              notify('وضعیت نمایش محصول تغییر کرد.');
                            }}
                            label={`نمایش ${prod.title} در فروشگاه`}
                          />
                        </div>

                        {/* Edit / Delete */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="inline-flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 font-heading text-xs font-bold text-ink hover:border-brand-600 cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>ویرایش</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(prod)}
                            aria-label={`حذف ${prod.title}`}
                            className="grid size-8 place-items-center rounded-xl text-muted hover:bg-clay-mist hover:text-state-error-ink cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================================================================
              SECTION 4: CUSTOMERS & CLUB CRM
              ================================================================ */}
          {activeSection === 'customers' && (
            <motion.div key="admin-customers" {...panelMotion} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-line/70 bg-card p-5">
                  <span className="text-xs text-muted">کل اعضای ثبت‌نام‌شده</span>
                  <strong className="mt-2 block font-heading text-2xl font-bold text-ink">
                    {formatNumber(users.length)} عضو
                  </strong>
                </div>
                <div className="rounded-3xl border border-line/70 bg-card p-5">
                  <span className="text-xs text-muted">اعضای سطح طلایی و مسی</span>
                  <strong className="mt-2 block font-heading text-2xl font-bold text-brand-700">
                    {formatNumber(
                      users.filter((u) => u.tier === 'طلایی' || u.tier === 'مسی').length,
                    )}{' '}
                    نفر
                  </strong>
                </div>
                <div className="rounded-3xl border border-line/70 bg-card p-5">
                  <span className="text-xs text-muted">مشترکین خبرنامه فصل</span>
                  <strong className="mt-2 block font-heading text-2xl font-bold text-moss-800">
                    {formatNumber(users.filter((u) => u.newsletter).length)} نفر
                  </strong>
                </div>
              </div>

              <div className="rounded-3xl border border-line/70 bg-card p-4 sm:p-6 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[680px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="py-3 px-2 text-start font-medium">نام عضو</th>
                      <th className="py-3 px-2 text-start font-medium">شماره همراه و ایمیل</th>
                      <th className="py-3 px-2 text-start font-medium">شهر</th>
                      <th className="py-3 px-2 text-start font-medium">سطح باشگاه</th>
                      <th className="py-3 px-2 text-start font-medium">سفارش‌ها</th>
                      <th className="py-3 px-2 text-start font-medium">مجموع خرید</th>
                      <th className="py-3 px-2 text-end font-medium">پرونده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {enrichedCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-paper/60 transition-colors">
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sand font-heading text-xs font-bold text-brand-800">
                              {cust.name?.slice(0, 1) || 'ژ'}
                            </span>
                            <div>
                              <p className="font-heading font-bold text-ink">{cust.name}</p>
                              <p className="text-[11px] text-muted">عضویت: {cust.joinedAt}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <p className="font-medium text-ink" dir="ltr">
                            {localPhone(cust.phone) || cust.phone}
                          </p>
                          {cust.email && (
                            <p className="text-[11px] text-muted" dir="ltr">
                              {cust.email}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-muted">{cust.city || '—'}</td>
                        <td className="py-3.5 px-2">
                          <span className="rounded-full bg-sand/80 px-2.5 py-0.5 font-heading text-[11px] font-bold text-brand-800">
                            {cust.tier || 'عادی'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-heading font-bold text-ink">
                          {formatNumber(cust.orderCount)}
                        </td>
                        <td className="py-3.5 px-2 font-heading font-bold text-ink">
                          {formatMoney(cust.totalSpend, 'IRT')}
                        </td>
                        <td className="py-3.5 px-2 text-end">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="rounded-xl border border-line bg-paper px-3 py-1.5 font-heading text-xs font-bold text-ink hover:border-brand-600 cursor-pointer"
                          >
                            مدیریت عضو
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ================================================================
              SECTION 5: COUPONS & STOREFRONT SETTINGS
              ================================================================ */}
          {activeSection === 'settings' && (
            <motion.div
              key="admin-settings"
              {...panelMotion}
              className="grid gap-7 xl:grid-cols-[1fr_1.15fr]"
            >
              {/* Discount Coupons Card */}
              <section className="rounded-3xl border border-line/70 bg-card p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <h2 className="font-heading text-lg font-bold text-ink">
                    مدیریت کدهای تخفیف
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    تعریف کدهای کمپین فصلی و هدیه اعضای باشگاه مشتریان ژرکا
                  </p>
                </div>

                <form
                  onSubmit={handleAddCoupon}
                  className="rounded-2xl border border-line/70 bg-sand/45 p-4 space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="CODE (مثلاً BAHAR20)"
                      className="rounded-xl border border-line bg-card px-3 py-2 text-left font-mono text-xs text-ink focus:border-brand-600"
                    />
                    <input
                      type="text"
                      value={couponForm.title}
                      onChange={(e) => setCouponForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="عنوان کمپین تخفیف"
                      className="rounded-xl border border-line bg-card px-3 py-2 text-xs text-ink focus:border-brand-600"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm((f) => ({ ...f, type: e.target.value }))}
                      className="rounded-xl border border-line bg-card px-2.5 py-2 text-xs text-ink"
                    >
                      <option value="percent">درصدی (٪)</option>
                      <option value="fixed">مبلغ ثابت (تومان)</option>
                    </select>
                    <input
                      type="text"
                      value={couponForm.value}
                      onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder="مقدار"
                      className="rounded-xl border border-line bg-card px-3 py-2 text-xs text-ink"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-espresso px-3 py-2 font-heading text-xs font-bold text-cream hover:bg-brand-600 cursor-pointer"
                    >
                      + ثبت کد
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {coupons.map((cpn) => (
                    <div
                      key={cpn.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-paper/65 p-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-800"
                            dir="ltr"
                          >
                            {cpn.code}
                          </span>
                          <span className="font-heading text-xs font-bold text-ink">
                            {cpn.type === 'percent'
                              ? `${formatNumber(cpn.value)}٪ تخفیف`
                              : formatMoney(cpn.value, 'IRT')}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {cpn.title} · مصرف‌شده: {formatNumber(cpn.usedCount)} از{' '}
                          {formatNumber(cpn.maxUses)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <AdminSwitch
                          checked={cpn.active}
                          onChange={() => toggleAdminCoupon(cpn.id)}
                          label={`فعال‌سازی کد ${cpn.code}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            deleteAdminCoupon(cpn.id);
                            notify('کد تخفیف حذف شد.');
                          }}
                          aria-label={`حذف کد ${cpn.code}`}
                          className="grid size-8 place-items-center rounded-xl text-muted hover:bg-clay-mist hover:text-state-error-ink cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Storefront & Payment Settings */}
              <form
                onSubmit={handleSaveStoreSettings}
                className="rounded-3xl border border-line/70 bg-card p-6 sm:p-7 shadow-xs space-y-5"
              >
                <div>
                  <h2 className="font-heading text-lg font-bold text-ink">
                    تنظیمات ویترین، ارسال و درگاه پرداخت
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    تغییر متن نوار اعلان بالای سایت بلافاصله در ویترین فروشگاه اعمال می‌شود.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink">عنوان فروشگاه</span>
                    <input
                      type="text"
                      value={settingsForm.storeName}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, storeName: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink">
                      متن نوار اعلان بالای صفحات (زنده در هدر سایت)
                    </span>
                    <input
                      type="text"
                      value={settingsForm.announcementText}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, announcementText: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-ink">
                        تلفن پشتیبانی گالری
                      </span>
                      <input
                        type="text"
                        dir="ltr"
                        value={settingsForm.supportPhone}
                        onChange={(e) =>
                          setSettingsForm((s) => ({ ...s, supportPhone: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-2.5 text-left text-sm text-ink focus:border-brand-600 focus:bg-card"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-ink">
                        سقف ارسال رایگان (تومان)
                      </span>
                      <input
                        type="number"
                        dir="ltr"
                        value={settingsForm.freeShippingThreshold}
                        onChange={(e) =>
                          setSettingsForm((s) => ({
                            ...s,
                            freeShippingThreshold: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-2.5 text-left text-sm text-ink focus:border-brand-600 focus:bg-card"
                      />
                    </label>
                  </div>
                </div>

                <div className="rule-dots" />

                <div className="space-y-3">
                  {[
                    {
                      key: 'onlineGateway',
                      label: 'درگاه پرداخت آنلاین شاپرک (زرین‌پال / سامان)',
                    },
                    {
                      key: 'cardToCard',
                      label: 'پرداخت کارت‌به‌کارت با بارگذاری رسید بانکی',
                    },
                    {
                      key: 'codEnabled',
                      label: 'پرداخت در محل (ویژه شهر تهران)',
                    },
                    {
                      key: 'giftWrapAvailable',
                      label: 'بسته‌بندی هدیه امضادار ژرکا در مرحله تسویه‌حساب',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line/60 bg-paper/55 px-4 py-3 text-xs font-medium text-ink"
                    >
                      <span>{item.label}</span>
                      <AdminSwitch
                        checked={Boolean(settingsForm[item.key])}
                        onChange={(val) =>
                          setSettingsForm((s) => ({ ...s, [item.key]: val }))
                        }
                        label={item.label}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="btn-primary rounded-2xl px-7 py-3 font-heading text-xs sm:text-sm font-bold"
                  >
                    <Check size={15} />
                    <span>ذخیره تنظیمات فروشگاه</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: ORDER FULFILLMENT INSPECTOR
          ==================================================================== */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-espresso/60 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`مدیریت سفارش ${selectedOrder.id}`}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <span className="eyebrow" dir="ltr">
                    ORDER FULFILLMENT
                  </span>
                  <h3 className="mt-1 font-heading text-xl font-bold text-ink" dir="ltr">
                    {selectedOrder.id}
                  </h3>
                  <p className="text-xs text-muted">
                    {selectedOrder.customerName} · {selectedOrder.createdAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="grid size-9 place-items-center rounded-full bg-sand/60 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl border border-line/70 bg-paper/65 p-4 text-xs leading-6">
                <strong className="font-heading text-ink">نشانی گیرنده:</strong>
                <p className="mt-1 text-ink">{selectedOrder.addressLine || selectedOrder.city}</p>
                <p className="mt-1 text-muted">
                  تلفن: <span dir="ltr">{localPhone(selectedOrder.customerPhone)}</span>
                  {selectedOrder.postalCode ? ` · کد پستی: ${selectedOrder.postalCode}` : ''}
                </p>
              </div>

              <div className="space-y-2.5">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div
                    key={it.productId || idx}
                    className="flex items-center justify-between rounded-2xl border border-line/60 bg-card p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.title}
                          className="size-11 rounded-xl object-cover bg-sand"
                        />
                      )}
                      <div>
                        <p className="font-heading font-bold text-ink">{it.title}</p>
                        <p className="text-muted">{formatNumber(it.qty)} عدد</p>
                      </div>
                    </div>
                    <strong className="font-heading text-ink">
                      {formatMoney(it.lineTotal, selectedOrder.currency)}
                    </strong>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateAdminOrder(selectedOrder.id, {
                    trackingNumber: trackingDraft.trim(),
                    eta: etaDraft.trim(),
                  });
                  setSelectedOrderId(null);
                  notify('کد رهگیری و وضعیت مرسوله ذخیره شد.');
                }}
                className="space-y-4 border-t border-line pt-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">وضعیت سفارش</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        updateAdminOrder(selectedOrder.id, { status: e.target.value })
                      }
                      className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs font-heading font-bold text-ink"
                    >
                      {ORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">
                      کد رهگیری پستی / تیپاکس
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      value={trackingDraft}
                      onChange={(e) => setTrackingDraft(e.target.value)}
                      placeholder="TPX-000000000"
                      className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-left font-mono text-xs text-ink"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink">
                    یادداشت زمان تحویل (نمایش در پروفایل مشتری)
                  </span>
                  <input
                    type="text"
                    value={etaDraft}
                    onChange={(e) => setEtaDraft(e.target.value)}
                    placeholder="مثلاً: تحویل فردا بازه ۱۰ تا ۱۴"
                    className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs text-ink"
                  />
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="rounded-2xl border border-line px-4 py-2.5 font-heading text-xs font-bold text-muted cursor-pointer"
                  >
                    بستن
                  </button>
                  <button
                    type="submit"
                    className="btn-primary rounded-2xl px-6 py-2.5 font-heading text-xs font-bold"
                  >
                    ذخیره و اطلاع‌رسانی
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 2: CREATE / EDIT PRODUCT WITH LIVE CARD PREVIEW
          ==================================================================== */}
      <AnimatePresence>
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setProductModalOpen(false)}
              className="fixed inset-0 bg-espresso/60 backdrop-blur-[2px]"
            />
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label="فرم محصول"
              onSubmit={handleSaveProduct}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                <div>
                  <span className="eyebrow" dir="ltr">
                    JERKA CATALOG STUDIO
                  </span>
                  <h3 className="mt-1 font-heading text-lg sm:text-xl font-bold text-ink">
                    {productDraft._id ? 'ویرایش اثر در ویترین' : 'افزودن اثر تازه به ویترین ژرکا'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="grid size-9 place-items-center rounded-full bg-sand/60 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.45fr_1fr]">
                {/* Form Fields */}
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">
                      نام اثر / محصول <span className="text-brand-600">*</span>
                    </span>
                    <input
                      type="text"
                      required
                      value={productDraft.title}
                      onChange={(e) =>
                        setProductDraft((d) => ({ ...d, title: e.target.value }))
                      }
                      placeholder="مثلاً: گلدان سرامیکی لعاب شنی"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink">دسته‌بندی</span>
                      <select
                        value={productDraft.category}
                        onChange={(e) =>
                          setProductDraft((d) => ({ ...d, category: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-xs font-medium text-ink"
                      >
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink">کد کالا (SKU)</span>
                      <input
                        type="text"
                        dir="ltr"
                        value={productDraft.sku}
                        onChange={(e) =>
                          setProductDraft((d) => ({ ...d, sku: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-left font-mono text-xs text-ink"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink">قیمت (تومان)</span>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={productDraft.price}
                        onChange={(e) =>
                          setProductDraft((d) => ({ ...d, price: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-left text-xs text-ink"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink">قیمت قبل تخفیف</span>
                      <input
                        type="text"
                        dir="ltr"
                        value={productDraft.compareAtPrice}
                        onChange={(e) =>
                          setProductDraft((d) => ({ ...d, compareAtPrice: e.target.value }))
                        }
                        placeholder="اختیاری"
                        className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-left text-xs text-ink"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink">موجودی کارگاه</span>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={productDraft.stock}
                        onChange={(e) =>
                          setProductDraft((d) => ({ ...d, stock: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-left text-xs text-ink"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">جنس و متریال</span>
                    <input
                      type="text"
                      value={productDraft.material}
                      onChange={(e) =>
                        setProductDraft((d) => ({ ...d, material: e.target.value }))
                      }
                      placeholder="چوب گردو، سرامیک دست‌ساز، کتان طبیعی…"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-xs text-ink"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-ink">
                      تصویر استودیویی (انتخاب سریع یا نشانی تصویر)
                    </span>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {STUDIO_MEDIA_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setProductDraft((d) => ({ ...d, image: preset.url }))
                          }
                          className={`rounded-xl border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                            productDraft.image === preset.url
                              ? 'border-brand-600 bg-brand-50 text-brand-800'
                              : 'border-line bg-paper text-muted hover:text-ink'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="url"
                      dir="ltr"
                      value={productDraft.image}
                      onChange={(e) =>
                        setProductDraft((d) => ({ ...d, image: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-line bg-paper/60 px-3 py-2 text-left text-xs text-ink"
                    />
                  </div>
                </div>

                {/* Live Storefront Card Preview */}
                <div className="rounded-3xl border border-line/70 bg-sand/50 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-heading font-bold text-muted mb-3">
                      پیش‌نمایش کارت در ویترین ژرکا
                    </span>
                    <div className="rounded-3xl border border-line/70 bg-card p-3 shadow-xs">
                      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-sand">
                        {productDraft.image && (
                          <img
                            src={productDraft.image}
                            alt={productDraft.title || 'پیش‌نمایش'}
                            className="h-full w-full object-cover"
                          />
                        )}
                        {productDraft.isNew && (
                          <span className="absolute top-2.5 start-2.5 rounded-full bg-moss-900 px-2.5 py-0.5 text-[10px] font-bold text-on-moss">
                            جدید
                          </span>
                        )}
                      </div>
                      <div className="pt-3">
                        <span className="text-[11px] font-medium text-brand-600">
                          {productDraft.category}
                        </span>
                        <h4 className="mt-1 font-heading text-sm font-bold text-ink line-clamp-1">
                          {productDraft.title || 'عنوان اثر شما'}
                        </h4>
                        <p className="mt-2 font-heading text-sm font-bold text-ink">
                          {formatMoney(Number(productDraft.price) || 0, 'IRT')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-card px-3.5 py-2.5 text-xs">
                    <span className="font-medium text-ink">نشان «جدید» روی کارت</span>
                    <AdminSwitch
                      checked={productDraft.isNew}
                      onChange={(v) => setProductDraft((d) => ({ ...d, isNew: v }))}
                      label="نشان جدید"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-2xl border border-line px-5 py-2.5 font-heading text-xs font-bold text-muted cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn-primary rounded-2xl px-7 py-2.5 font-heading text-xs font-bold"
                >
                  ذخیره در ویترین
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL 3: CUSTOMER CRM DETAIL
          ==================================================================== */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 bg-espresso/60 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`پرونده ${selectedCustomer.name}`}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-card p-6 sm:p-7 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-muted" dir="ltr">
                    {localPhone(selectedCustomer.phone) || selectedCustomer.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="grid size-8 place-items-center rounded-full bg-sand/60 text-muted cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink">
                  سطح عضویت باشگاه مشتریان ژرکا
                </span>
                <select
                  value={selectedCustomer.tier || 'نقره‌ای'}
                  onChange={(e) => {
                    const tier = e.target.value;
                    updateAdminCustomer(selectedCustomer.id, { tier });
                    setSelectedCustomer((c) => ({ ...c, tier }));
                    notify('سطح عضویت مشتری به‌روزرسانی شد.');
                  }}
                  className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs font-heading font-bold text-ink"
                >
                  <option value="جدید">عضو جدید</option>
                  <option value="نقره‌ای">نقره‌ای</option>
                  <option value="مسی">مسی</option>
                  <option value="طلایی">طلایی (VIP)</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink">
                  یادداشت داخلی کارگاه و بسته‌بندی
                </span>
                <textarea
                  rows={3}
                  value={selectedCustomer.adminNote || ''}
                  onChange={(e) => {
                    const adminNote = e.target.value;
                    updateAdminCustomer(selectedCustomer.id, { adminNote });
                    setSelectedCustomer((c) => ({ ...c, adminNote }));
                  }}
                  placeholder="توضیحات اختصاصی مشتری برای تیم بسته‌بندی…"
                  className="w-full resize-none rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs text-ink"
                />
              </label>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-primary rounded-2xl px-6 py-2.5 font-heading text-xs font-bold"
                >
                  تأیید و بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
