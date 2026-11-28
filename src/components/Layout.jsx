import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Menu, X, Check, User } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAtelierStore } from '@/lib/atelier-store';
import { ROUTES } from '@/lib/routes';
import CartDrawer from '@/components/CartDrawer';
import { CartDrawerContext } from '@/components/cart-drawer-context';
import { homeContent } from '@/pages/home.content';
import EnamadSeal from '@/seo/EnamadSeal';

const NAV_LINKS = [
  { to: ROUTES.home, label: 'صفحه اصلی' },
  { to: ROUTES.shop, label: 'فروشگاه' },
  { to: '/#story', label: 'داستان ژرکا', hash: true },
  { to: ROUTES.profile, label: 'حساب کاربری' },
  { to: ROUTES.admin, label: 'پنل مدیریت' },
];

function Wordmark({ tone = 'dark' }) {
  return (
    <Link
      to={ROUTES.home}
      className="group flex flex-col items-center leading-none text-center"
      aria-label="ژرکا — صفحه اصلی"
    >
      <span
        className={`font-heading text-2xl md:text-2.5xl font-bold tracking-tight transition-colors ${
          tone === 'light' ? 'text-on-espresso' : 'text-ink'
        } group-hover:text-brand-600`}
      >
        ژرکا
      </span>
      <span
        className={`mt-1 font-display text-[10px] tracking-[0.45em] transition-colors ${
          tone === 'light' ? 'text-neutral-400' : 'text-muted'
        } group-hover:text-brand-600`}
      >
        JERKA
      </span>
    </Link>
  );
}

function Header({ drawer }) {
  const { count } = useCart();
  const { currentUser, isAuthenticated, storeSettings } = useAtelierStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === ROUTES.home;
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 20);

  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const announcementText =
    storeSettings?.announcementText || homeContent.announcement.text;

  return (
    <>
      {/* Announcement band — hidden on home page so navbar sits directly on hero image */}
      {!isHome && (
        <div className="bg-espresso py-2.5 text-center text-on-espresso">
          <p className="container-max text-xs text-on-espresso/90 md:text-[13px]">
            {announcementText}
          </p>
        </div>
      )}

      <header
        className={
          isHome
            ? scrolled
              ? 'fixed top-0 inset-x-0 z-30 border-b border-line bg-paper/95 backdrop-blur-md shadow-xs transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
              : 'absolute top-0 inset-x-0 z-30 border-b border-transparent bg-transparent transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md'
        }
      >
        <div className="container-max flex h-[72px] items-center justify-between gap-4">
          {/* Center: Dual-script Wordmark */}
          <div className="flex shrink-0 lg:flex-initial justify-center">
            <Wordmark />
          </div>
          {/* Inline-start: Desktop Navigation */}
          <nav aria-label="ناوبری اصلی" className="hidden lg:flex flex-1 justify-center items-center">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) =>
                link.hash ? (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      onClick={(e) => {
                        const targetId = link.to.replace('/#', '');
                        const el = document.getElementById(targetId);
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="link-underline text-sm font-medium text-neutral-800 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `link-underline text-sm font-medium transition-colors ${
                          isActive ? 'text-brand-700' : 'text-neutral-800 hover:text-brand-700'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {/* Inline-end: Account + Cart cluster */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
            {isAuthenticated && currentUser ? (
              <Link
                to={ROUTES.profile}
                aria-label={`حساب کاربری ${currentUser.name}`}
                className="flex items-center gap-2 rounded-full border border-line/80 bg-sand/75 py-1.5 ps-2 pe-3.5 text-xs sm:text-sm font-heading font-bold text-ink transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-600 hover:bg-sand active:scale-95"
              >
                <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-cream">
                  {currentUser.name?.slice(0, 1) || 'ژ'}
                </span>
                <span className="hidden sm:inline max-w-28 truncate leading-none">
                  {currentUser.name}
                </span>
              </Link>
            ) : (
              <Link
                to={ROUTES.login}
                aria-label="ورود یا ثبت‌نام در ژرکا"
                className="flex items-center gap-1.5 rounded-full border border-line/80 bg-card/85 py-2 px-3 sm:py-2.5 sm:px-3.5 text-xs sm:text-sm font-heading font-bold text-ink backdrop-blur-xs transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-600 hover:text-brand-700 active:scale-95"
              >
                <User size={15} strokeWidth={1.9} className="text-brand-600" />
                <span>ورود</span>
              </Link>
            )}

            <button
              type="button"
              onClick={drawer.openDrawer}
              aria-label={`سبد خرید، ${count} کالا`}
              className="relative flex items-center gap-2 rounded-full bg-espresso py-2 px-3.5 sm:py-2.5 sm:pr-4 sm:pl-3 text-xs sm:text-sm font-bold text-cream transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#2b2620] active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="font-heading font-bold text-cream leading-none">سبد</span>
              <ShoppingBag size={16} strokeWidth={2} className="text-cream" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-brand-600 font-heading text-[10px] font-bold leading-none text-white ring-2 ring-paper shadow-xs"
                  >
                    {count.toLocaleString('fa-IR')}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="منوی موبایل"
              className="p-2 text-neutral-800 transition-[color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-brand-700 active:scale-[0.98] lg:hidden"
            >
              {menuOpen ? <X size={20} strokeWidth={1.6} /> : <Menu size={20} strokeWidth={1.6} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-paper shadow-md lg:hidden"
              aria-label="ناوبری موبایل"
            >
              <ul className="container-max divide-y divide-line py-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.hash ? link.to : link.to}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-sm font-medium text-neutral-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to={ROUTES.login}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-sm font-bold text-brand-700"
                  >
                    {isAuthenticated ? 'مدیریت نشست / تغییر حساب' : 'ورود و ثبت‌نام در ژرکا'}
                  </Link>
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 4000);
  }

  const columns = [
    {
      title: 'فروشگاه',
      links: [
        { label: 'نشیمن', to: `${ROUTES.shop}?category=living` },
        { label: 'نورپردازی', to: `${ROUTES.shop}?category=lighting` },
        { label: 'منسوجات', to: `${ROUTES.shop}?category=textiles` },
        { label: 'دکور', to: `${ROUTES.shop}?category=decor` },
      ],
    },
    {
      title: 'ژرکا',
      links: [
        { label: 'داستان ما', to: '/#story', hash: true },
        { label: 'هنرمندان', to: '/#story', hash: true },
        { label: 'کارگاه‌ها', to: '/#story', hash: true },
        { label: 'تماس', to: ROUTES.shop },
      ],
    },
    {
      title: 'حساب کاربری',
      links: [
        { label: 'ورود و عضویت', to: ROUTES.login },
        { label: 'پروفایل من', to: ROUTES.profile },
        { label: 'سفارش‌ها و رهگیری', to: `${ROUTES.profile}?tab=orders` },
        { label: 'پنل مدیریت', to: ROUTES.admin },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#261d18] text-white overflow-hidden pt-14 sm:pt-20">
      <div className="container-max">
        {/* Top: Newsletter Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
          {/* Right (start): Eyebrow + Heading */}
          <div className="text-start">
            <span className="text-[#d49a62] text-xs sm:text-sm font-medium tracking-normal">
              خبرنامه‌ی ژرکا
            </span>
            <h2 className="mt-2.5 font-heading text-xl sm:text-2xl md:text-3xl lg:text-[1.95rem] font-bold text-white leading-snug">
              اولین نفری باشید که مجموعه‌ی تازه را می‌بیند.
            </h2>
          </div>

          {/* Left (end): Pill Newsletter Form */}
          <div className="w-full sm:w-auto">
            {submitted ? (
              <div className="flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-6 py-3 text-sm text-emerald-200">
                <Check size={16} className="text-emerald-400" />
                <span>عضویت شما با موفقیت ثبت شد.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center w-full sm:w-[380px] md:w-[420px] rounded-full bg-white/[0.07] border border-white/10 p-1.5 backdrop-blur-xs transition-[border-color,box-shadow] focus-within:border-[#c0653d]/70 focus-within:ring-2 focus-within:ring-[#c0653d]/20 overflow-hidden"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل شما"
                  aria-label="نشانی ایمیل شما"
                  className="min-w-0 flex-1 bg-transparent px-4 sm:px-5 py-2 text-sm text-white placeholder:text-neutral-400/80 outline-none border-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none text-start [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#b85d38] hover:bg-[#c66841] active:scale-[0.97] px-6 py-2.5 text-xs sm:text-sm font-medium text-white transition-[background-color,transform] duration-200 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0653d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#261d18]"
                >
                  عضویت
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full border-t border-white/10 my-12 sm:my-16" />

        {/* Middle: 3 Columns center aligned */}
        <div className="flex flex-wrap items-start justify-center gap-16 sm:gap-24 md:gap-32 lg:gap-36">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col items-center text-center min-w-[120px]">
              <h4 className="font-heading text-sm font-semibold tracking-wide text-[#d49a62] text-center">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3 sm:space-y-3.5 text-center">
                {col.links.map((link) => (
                  <li key={link.label} className="text-center">
                    {link.hash ? (
                      <a
                        href={link.to}
                        onClick={(e) => {
                          const targetId = link.to.replace('/#', '');
                          const el = document.getElementById(targetId);
                          if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-sm text-neutral-300/70 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-neutral-300/70 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom Giant Watermark "JERKA" */}
        <div className="relative mt-8 sm:mt-12 -mb-4 sm:-mb-8 md:-mb-12 lg:-mb-14 select-none pointer-events-none overflow-hidden text-center">
          <span className="block font-display text-[5.5rem] sm:text-[9.5rem] md:text-[13.5rem] lg:text-[17rem] xl:text-[20rem] font-bold tracking-[0.04em] leading-none text-white/[0.04] uppercase">
            JERKA
          </span>
        </div>
      </div>

      {/* Subtle Trust & Copyright strip */}
      <div className="relative z-10 border-t border-white/5 py-5 text-xs text-neutral-400/50">
        <div className="container-max flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
          <p>© {year.toLocaleString('fa-IR', { useGrouping: false })} ژرکا — تمام حقوق محفوظ است.</p>
          <div className="flex items-center gap-6">
            <EnamadSeal />
            <span className="font-display tracking-[0.25em] text-[10px] text-neutral-400/40">
              JERKA · CRAFTED WITH CARE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Site shell. Auto-wraps every route, rendering pages through <Outlet/>.
 */
export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute =
    location.pathname === ROUTES.admin ||
    location.pathname.startsWith(`${ROUTES.admin}/`);

  // Scroll to top on route navigation; in-page (#hash) jumps keep position.
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const drawer = useMemo(
    () => ({
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [],
  );

  return (
    <CartDrawerContext.Provider value={drawer}>
      {isAdminRoute ? (
        <main className="min-h-screen bg-paper text-ink">{children ?? <Outlet />}</main>
      ) : (
        <div className="flex min-h-screen flex-col bg-paper text-ink">
          <Header drawer={drawer} />
          <main className="flex-1">{children ?? <Outlet />}</main>
          <Footer />
        </div>
      )}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </CartDrawerContext.Provider>
  );
}
