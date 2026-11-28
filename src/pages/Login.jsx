import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import {
  normalizeIranianMobile,
  formatIranianMobile,
  toLatinDigits,
} from '@/api/auth';
import {
  requestOtpCode,
  verifyOtpCode,
  signInWithPassword,
  registerAccount,
  signInDemo,
  signOut,
  useAtelierStore,
} from '@/lib/atelier-store';
import { formatNumber } from '@/lib/money';
import { EASE } from '@/lib/motion';
import { ROUTES } from '@/lib/routes';
import { homeContent } from './home.content';

const AUTH_TABS = [
  { id: 'otp', label: 'ورود پیامکی', icon: Phone },
  { id: 'password', label: 'رمز عبور', icon: KeyRound },
  { id: 'register', label: 'عضویت جدید', icon: UserPlus },
];

const MEMBER_PILLARS = [
  {
    icon: Sparkles,
    title: 'دسترسی پیش از موعد به کلکسیون‌ها',
    text: 'اعضای ژرکا پیش از رونمایی عمومی، آثار دست‌ساز فصل تازه را مشاهده و رزرو می‌کنند.',
  },
  {
    icon: MapPin,
    title: 'دفترچه نشانی‌ها و تسویه سریع',
    text: 'ثبت امن نشانی‌های منتخب برای ثبت سفارش در چند ثانیه بدون ورود تکراری اطلاعات.',
  },
  {
    icon: ShieldCheck,
    title: 'پیگیری لحظه‌ای و شناسنامه اصالت',
    text: 'مشاهده وضعیت آماده‌سازی در کارگاه، کد رهگیری پستی و سوابق خرید در یک نگاه.',
  },
];

function passwordStrength(pwd) {
  const val = String(pwd || '');
  if (!val) return { level: 0, label: '', tone: 'bg-sand-deep' };
  let score = 0;
  if (val.length >= 6) score += 1;
  if (val.length >= 9 || /[A-Z]/i.test(val)) score += 1;
  if (/\d/.test(val) && val.length >= 8) score += 1;
  if (score <= 1) return { level: 1, label: 'کوتاه یا ساده', tone: 'bg-clay' };
  if (score === 2) return { level: 2, label: 'ایمنی مطلوب', tone: 'bg-saffron' };
  return { level: 3, label: 'بسیار امن', tone: 'bg-moss-600' };
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${formatNumber(mins).padStart(2, '۰')}:${formatNumber(secs).padStart(2, '۰')}`;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { currentUser, isAuthenticated } = useAtelierStore();

  const redirectParam = searchParams.get('redirect');
  const safeRedirect =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : null;

  const initialMode = searchParams.get('mode');
  const [activeTab, setActiveTab] = useState(
    AUTH_TABS.some((t) => t.id === initialMode) ? initialMode : 'otp',
  );

  // OTP flow state
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
  const [otpPhone, setOtpPhone] = useState('');
  const [otpGuestName, setOtpGuestName] = useState('');
  const [otpMeta, setOtpMeta] = useState(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Password login state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Feedback state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Countdown tick for OTP resend
  useEffect(() => {
    if (otpStep !== 'verify' || countdown <= 0) return undefined;
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [otpStep, countdown]);

  const validOtpPhone = Boolean(normalizeIranianMobile(otpPhone));
  const strength = passwordStrength(regPassword);

  function switchTab(nextTab) {
    setActiveTab(nextTab);
    setError('');
    setNotice('');
  }

  function finishSignIn(user, explicitDestination) {
    const target =
      explicitDestination ||
      safeRedirect ||
      (user?.role === 'admin' ? ROUTES.admin : ROUTES.profile);
    navigate(target);
  }

  async function handleRequestOtp(e) {
    if (e) e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const info = await requestOtpCode(otpPhone);
      setOtpMeta(info);
      setOtpStep('verify');
      setOtpDigits(['', '', '', '', '']);
      setCountdown(info.expiresInSeconds || 120);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 80);
    } catch (err) {
      setError(err?.message || 'ارسال کد تأیید انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function submitOtpCode(joinedCode) {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const user = await verifyOtpCode({
        phone: otpMeta?.phone || otpPhone,
        code: joinedCode,
        name: otpGuestName,
      });
      finishSignIn(user);
    } catch (err) {
      setError(err?.message || 'تأیید کد انجام نشد.');
      setBusy(false);
    }
  }

  function handleOtpDigitChange(index, rawVal) {
    const clean = toLatinDigits(rawVal).replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Handle multi-digit paste or autofill
    if (clean.length > 1) {
      const chars = clean.slice(0, 5).split('');
      const next = ['', '', '', '', ''];
      chars.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(chars.length, 4);
      otpRefs.current[focusIdx]?.focus();
      if (chars.length === 5) {
        void submitOtpCode(chars.join(''));
      }
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (index < 4) {
      otpRefs.current[index + 1]?.focus();
    }
    const combined = next.join('');
    if (combined.length === 5 && !next.includes('')) {
      void submitOtpCode(combined);
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function autofillPreviewCode() {
    if (!otpMeta?.previewCode) return;
    const chars = String(otpMeta.previewCode).slice(0, 5).split('');
    setOtpDigits(chars);
    void submitOtpCode(chars.join(''));
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const user = await signInWithPassword({
        identifier,
        password: loginPassword,
      });
      finishSignIn(user);
    } catch (err) {
      setError(err?.message || 'ورود به حساب انجام نشد.');
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const user = await registerAccount({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
      });
      finishSignIn(user);
    } catch (err) {
      setError(err?.message || 'ثبت‌نام انجام نشد.');
      setBusy(false);
    }
  }

  function handleQuickDemo(role) {
    const user = signInDemo(role);
    finishSignIn(user, role === 'admin' ? ROUTES.admin : safeRedirect || ROUTES.profile);
  }

  const cardMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: EASE },
      };

  return (
    <div className="min-h-screen bg-paper pb-20 pt-6 sm:pt-10">
      <div className="container-max">
        {/* Breadcrumb */}
        <nav aria-label="مسیر صفحه" className="mb-6 text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to={ROUTES.home} className="transition-colors hover:text-brand-600">
                خانه
              </Link>
            </li>
            <li aria-hidden className="text-saffron">
              <ChevronLeft size={13} />
            </li>
            <li className="font-semibold text-ink">ورود و عضویت در ژرکا</li>
          </ol>
        </nav>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.04fr_1fr] xl:gap-10">
          {/* Editorial Moss Atelier Column */}
          <motion.section
            {...cardMotion}
            aria-label="معرفی باشگاه اعضای ژرکا"
            className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-moss-band p-7 sm:p-10 md:p-12 text-on-moss shadow-md"
          >
            {/* Subtle editorial background photograph */}
            <img
              src={homeContent.brandStory.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-14 mix-blend-luminosity select-none"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-moss-950/90 via-moss-900/65 to-transparent"
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-on-moss/15 bg-on-moss/8 px-3.5 py-1.5 backdrop-blur-xs">
                <Sparkles size={13} className="text-saffron" />
                <span className="eyebrow text-saffron!" dir="ltr">
                  JERKA MEMBER ATELIER
                </span>
              </div>

              <h1 className="mt-6 font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.38] text-on-moss text-balance">
                به خانه‌ی طراحی، مکث و اصالت ژرکا خوش آمدید.
              </h1>

              <p className="mt-4 max-w-lg text-sm sm:text-base leading-8 text-on-moss/80">
                با ورود به حساب کاربری ژرکا، تمام سفارش‌های دست‌ساز، نشانی‌های منتخب و امتیازهای باشگاه مشتریان شما در فضایی آرام و یکپارچه در دسترس خواهد بود.
              </p>

              <div className="mt-9 space-y-4 border-t border-on-moss/12 pt-8">
                {MEMBER_PILLARS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 rounded-2xl border border-on-moss/10 bg-on-moss/6 p-4 backdrop-blur-xs"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-moss/12 text-saffron">
                        <Icon size={19} strokeWidth={1.7} />
                      </span>
                      <div>
                        <h2 className="font-heading text-sm font-bold text-on-moss">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-xs leading-6 text-on-moss/70">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Atelier Seal */}
            <div className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-on-moss/12 pt-6 text-xs text-on-moss/70">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-brand-300" />
                <span>اتصال امن و حفاظت کامل از حریم خصوصی اعضا</span>
              </div>
              <span className="font-display text-[11px] tracking-[0.32em] text-on-moss/55" dir="ltr">
                EST. TEHRAN
              </span>
            </div>
          </motion.section>

          {/* Interactive Auth Form Card */}
          <motion.section
            {...cardMotion}
            aria-label="فرم ورود و ثبت‌نام"
            className="flex flex-col justify-between rounded-3xl border border-line/80 bg-card p-6 sm:p-9 md:p-10 shadow-sm"
          >
            <div>
              {/* Active Session Banner if already signed in */}
              {isAuthenticated && currentUser && (
                <div className="mb-7 rounded-2xl border border-brand-200 bg-sand/55 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-espresso font-heading text-sm font-bold text-cream">
                        {currentUser.name?.slice(0, 1) || 'ژ'}
                      </span>
                      <div>
                        <p className="text-xs text-muted">نشست فعال شما در ژرکا</p>
                        <p className="font-heading text-sm sm:text-base font-bold text-ink">
                          {currentUser.name}
                          <span className="ms-2 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-medium text-brand-800">
                            {currentUser.role === 'admin' ? 'مدیر ارشد' : `عضو ${currentUser.tier || 'ژرکا'}`}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-clay hover:text-clay active:scale-95 cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>خروج</span>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      to={ROUTES.profile}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-espresso px-4 py-2.5 font-heading text-xs font-bold text-cream transition-colors hover:bg-brand-600 active:scale-[0.98]"
                    >
                      <User size={14} />
                      <span>حساب کاربری من</span>
                    </Link>
                    <Link
                      to={ROUTES.admin}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 font-heading text-xs font-bold text-ink transition-colors hover:border-brand-600 hover:text-brand-700 active:scale-[0.98]"
                    >
                      <LayoutDashboard size={14} />
                      <span>پنل مدیریت</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <p className="eyebrow" dir="ltr">
                  CLIENT SIGN IN
                </p>
                <h2 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-ink text-balance">
                  {activeTab === 'register'
                    ? 'ایجاد حساب کاربری تازه'
                    : 'ورود به حساب کاربری ژرکا'}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-muted">
                  {activeTab === 'otp' &&
                    'شماره تلفن همراه خود را وارد کنید تا کد تأیید یک‌بارمصرف برایتان ارسال شود.'}
                  {activeTab === 'password' &&
                    'با شماره موبایل یا پست الکترونیک و رمز عبور خود وارد شوید.'}
                  {activeTab === 'register' &&
                    'اطلاعات خود را ثبت کنید و به جمع اعضای باشگاه مشتریان ژرکا بپیوندید.'}
                </p>
              </div>

              {/* Segmented Mode Control */}
              <div
                role="tablist"
                aria-label="روش ورود به حساب"
                className="mb-7 grid grid-cols-3 gap-1 rounded-2xl border border-line/70 bg-sand/75 p-1"
              >
                {AUTH_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => switchTab(tab.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 font-heading text-xs sm:text-[13px] font-bold transition-[background-color,color,transform] duration-200 active:scale-[0.98] cursor-pointer ${
                        active
                          ? 'bg-espresso text-cream shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.8} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Error / Notice Alert */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="auth-error"
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="mb-5 rounded-2xl border border-clay/40 bg-clay-mist px-4 py-3 text-xs leading-6 font-medium text-state-error-ink"
                  >
                    {error}
                  </motion.div>
                )}
                {notice && !error && (
                  <motion.div
                    key="auth-notice"
                    role="status"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="mb-5 flex items-center gap-2 rounded-2xl border border-moss-600/30 bg-moss-mist px-4 py-3 text-xs font-medium text-moss-900"
                  >
                    <CheckCircle2 size={15} className="text-moss-800 shrink-0" />
                    <span>{notice}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TAB 1: MOBILE OTP */}
              {activeTab === 'otp' && (
                <div>
                  {otpStep === 'request' ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <label className="block">
                        <span className="mb-2 flex items-center justify-between text-xs sm:text-sm font-medium text-ink">
                          <span>شماره تلفن همراه</span>
                          {validOtpPhone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-moss-800">
                              <Check size={12} />
                              شماره معتبر
                            </span>
                          )}
                        </span>
                        <div className="relative">
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            dir="ltr"
                            required
                            value={otpPhone}
                            onChange={(e) => setOtpPhone(e.target.value)}
                            placeholder="0912 345 6789"
                            className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3.5 text-left font-body text-sm sm:text-base text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                          />
                        </div>
                        <span className="mt-1.5 block text-[11px] text-muted">
                          ارقام فارسی و انگلیسی هر دو پذیرفته می‌شوند (نمونه: ۰۹۱۲۳۴۵۶۷۸۹).
                        </span>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs sm:text-sm font-medium text-ink">
                          نام شما <span className="text-xs font-normal text-muted">(اختیاری برای اولین ورود)</span>
                        </span>
                        <input
                          type="text"
                          autoComplete="name"
                          value={otpGuestName}
                          onChange={(e) => setOtpGuestName(e.target.value)}
                          placeholder="مثلاً: سارا رادمهر"
                          className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={busy}
                        className="btn-primary mt-2 w-full rounded-2xl py-3.5 font-heading font-bold text-sm sm:text-base shadow-sm"
                      >
                        {busy ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            <span>در حال ارسال کد تأیید…</span>
                          </>
                        ) : (
                          <>
                            <span>دریافت کد تأیید پیامکی</span>
                            <ArrowLeft size={16} strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitOtpCode(otpDigits.join(''));
                      }}
                      className="space-y-5"
                    >
                      {/* Phone summary & change button */}
                      <div className="flex items-center justify-between rounded-2xl border border-line/80 bg-sand/45 px-4 py-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted">کد ۵ رقمی ارسال شد به: </span>
                          <strong className="font-heading text-ink" dir="ltr">
                            {formatIranianMobile(otpMeta?.phone || otpPhone)}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('request');
                            setError('');
                          }}
                          className="font-heading text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                        >
                          ویرایش شماره
                        </button>
                      </div>

                      {/* Preview SMS Code Helper */}
                      {otpMeta?.previewCode && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-saffron/40 bg-saffron-mist px-4 py-3 text-xs text-ink">
                          <div>
                            <span className="font-semibold text-brand-800">پیش‌نمایش پیامک ژرکا: </span>
                            <span>کد تأیید آزمایشی شما </span>
                            <strong className="mx-1 rounded-lg bg-card px-2 py-0.5 font-heading text-sm text-espresso border border-line">
                              {formatNumber(otpMeta.previewCode)}
                            </strong>
                            <span> است.</span>
                          </div>
                          <button
                            type="button"
                            onClick={autofillPreviewCode}
                            className="rounded-xl bg-espresso px-3 py-1.5 font-heading text-[11px] font-bold text-cream transition-colors hover:bg-brand-600 active:scale-95 cursor-pointer"
                          >
                            درج و ورود خودکار
                          </button>
                        </div>
                      )}

                      {/* 5 OTP Input Cells */}
                      <div>
                        <span className="mb-2.5 block text-xs sm:text-sm font-medium text-ink">
                          کد تأیید ۵ رقمی
                        </span>
                        <div className="flex items-center justify-center gap-2.5 sm:gap-3" dir="ltr">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              aria-label={`رقم ${idx + 1} کد تأیید`}
                              value={digit ? formatNumber(digit) : ''}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="size-12 sm:size-14 rounded-2xl border border-line bg-paper/70 text-center font-heading text-lg sm:text-xl font-bold text-ink transition-colors focus:border-brand-600 focus:bg-card"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Timer / Resend */}
                      <div className="flex items-center justify-between text-xs text-muted">
                        {countdown > 0 ? (
                          <span>مانده تا دریافت مجدد کد: {formatTimer(countdown)}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleRequestOtp()}
                            className="inline-flex items-center gap-1.5 font-heading font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                          >
                            <RefreshCw size={13} />
                            <span>ارسال مجدد کد تأیید</span>
                          </button>
                        )}
                        {otpMeta?.existingName && (
                          <span className="text-moss-800 font-medium">
                            خوش برگشتید، {otpMeta.existingName}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={busy || otpDigits.join('').length < 5}
                        className="btn-primary w-full rounded-2xl py-3.5 font-heading font-bold text-sm sm:text-base"
                      >
                        {busy ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            <span>در حال بررسی…</span>
                          </>
                        ) : (
                          <>
                            <span>تأیید و ورود به حساب</span>
                            <ArrowLeft size={16} strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: PASSWORD LOGIN */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs sm:text-sm font-medium text-ink">
                      شماره موبایل یا پست الکترونیک
                    </span>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="sara@jerka.ir / 09123456789"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3.5 text-left text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center justify-between text-xs sm:text-sm font-medium text-ink">
                      <span>رمز عبور</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('otp');
                          setNotice('برای ورود بدون رمز عبور، شماره همراه خود را وارد کنید.');
                        }}
                        className="text-xs font-normal text-brand-700 hover:underline cursor-pointer"
                      >
                        فراموشی رمز / ورود پیامکی
                      </button>
                    </span>
                    <div className="relative">
                      <input
                        type={showLoginPwd ? 'text' : 'password'}
                        required
                        dir="ltr"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-line bg-paper/60 ps-11 pe-4 py-3.5 text-left text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                      />
                      <button
                        type="button"
                        aria-label={showLoginPwd ? 'پنهان کردن رمز' : 'نمایش رمز'}
                        onClick={() => setShowLoginPwd((v) => !v)}
                        className="absolute inset-y-0 start-3 flex items-center text-muted hover:text-ink cursor-pointer"
                      >
                        {showLoginPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>

                  <div className="rounded-2xl border border-line/70 bg-sand/35 px-3.5 py-2.5 text-[11px] leading-6 text-muted">
                    <span>نمونه حساب مشتری: </span>
                    <code className="font-mono text-ink" dir="ltr">sara@jerka.ir</code>
                    <span> با رمز </span>
                    <code className="font-mono text-ink" dir="ltr">jerka1405</code>
                    <span className="mx-1.5">|</span>
                    <span>مدیر: </span>
                    <code className="font-mono text-ink" dir="ltr">admin@jerka.ir</code>
                    <span> با رمز </span>
                    <code className="font-mono text-ink" dir="ltr">admin1405</code>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-primary mt-2 w-full rounded-2xl py-3.5 font-heading font-bold text-sm sm:text-base"
                  >
                    {busy ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>در حال ورود…</span>
                      </>
                    ) : (
                      <>
                        <span>ورود به حساب ژرکا</span>
                        <ArrowLeft size={16} strokeWidth={2} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 3: REGISTER */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-ink">
                        نام و نام خانوادگی <span className="text-brand-600">*</span>
                      </span>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="نام کامل شما"
                        className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
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
                        autoComplete="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0912 345 6789"
                        className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-left text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink">
                      نشانی ایمیل <span className="text-muted font-normal">(اختیاری)</span>
                    </span>
                    <input
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-left text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink">
                      <span>
                        انتخاب رمز عبور <span className="text-brand-600">*</span>
                      </span>
                      {strength.label && (
                        <span className="text-[11px] text-muted">{strength.label}</span>
                      )}
                    </span>
                    <div className="relative">
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        required
                        minLength={6}
                        dir="ltr"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="حداقل ۶ نویسه"
                        className="w-full rounded-2xl border border-line bg-paper/60 ps-11 pe-4 py-3 text-left text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-brand-600 focus:bg-card"
                      />
                      <button
                        type="button"
                        aria-label={showRegPwd ? 'پنهان کردن رمز' : 'نمایش رمز'}
                        onClick={() => setShowRegPwd((v) => !v)}
                        className="absolute inset-y-0 start-3 flex items-center text-muted hover:text-ink cursor-pointer"
                      >
                        {showRegPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((step) => (
                        <span
                          key={step}
                          className={`h-1 rounded-full transition-colors ${
                            strength.level >= step ? strength.tone : 'bg-sand-deep/70'
                          }`}
                        />
                      ))}
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-primary mt-2 w-full rounded-2xl py-3.5 font-heading font-bold text-sm sm:text-base"
                  >
                    {busy ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>در حال ساخت حساب…</span>
                      </>
                    ) : (
                      <>
                        <span>تکمیل عضویت و دریافت ۳۵۰ امتیاز هدیه</span>
                        <ArrowLeft size={16} strokeWidth={2} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Demo Sign-In Section */}
            <div className="mt-7 pt-2">
              <div className="rule-dots mb-5" />
              <div className="mb-3 flex items-center justify-between">
                <span className="font-heading text-xs font-bold text-ink">
                  دسترسی سریع پیش‌نمایش (یک کلیک)
                </span>
                <span className="text-[11px] text-muted">بدون نیاز به تایپ</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('customer')}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-sand/45 p-3.5 text-start transition-[border-color,background-color,transform] duration-200 hover:border-brand-600 hover:bg-sand/80 active:scale-[0.98] cursor-pointer"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-cream shadow-2xs">
                    <User size={18} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block font-heading text-xs font-bold text-ink group-hover:text-brand-700">
                      ورود به عنوان مشتری
                    </strong>
                    <span className="block truncate text-[11px] text-muted">
                      سارا رادمهر · پروفایل و سفارش‌ها
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-sand/45 p-3.5 text-start transition-[border-color,background-color,transform] duration-200 hover:border-espresso hover:bg-sand/80 active:scale-[0.98] cursor-pointer"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-espresso text-cream shadow-2xs">
                    <LayoutDashboard size={18} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block font-heading text-xs font-bold text-ink">
                      ورود مدیر فروشگاه
                    </strong>
                    <span className="block truncate text-[11px] text-muted">
                      فرهاد ستوده · داشبورد مدیریت
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
