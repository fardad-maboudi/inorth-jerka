import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Info, Smartphone } from 'lucide-react';
import { pwaConfig } from '../config/pwa';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

const PLATFORM_STEPS = {
  android: [
    'منوی مرورگر کروم (سه نقطه) را باز کنید.',
    '«افزودن به صفحهٔ اصلی» یا Install app را بزنید.',
    'نصب را تأیید کنید.',
  ],
  ios: [
    'در سافاری دکمهٔ Share (مربع و پیکان) را بزنید.',
    '«افزودن به صفحهٔ اصلی» را انتخاب کنید.',
    'روی Add بزنید.',
  ],
  desktop: [
    'در کروم یا اج، آیکون نصب را در نوار آدرس بزنید.',
    'یا از منوی مرورگر «Install …» / «نصب» را انتخاب کنید.',
  ],
};

const cardShell =
  'w-full max-w-2xl rounded-[2rem] border border-zinc-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8';

function PageShell({ children }) {
  return (
    <main dir="rtl" className="flex min-h-[76vh] items-center justify-center bg-transparent px-4 py-10 sm:py-14">
      <div className={cardShell}>{children}</div>
    </main>
  );
}

/**
 * Farsi install guide for site visitors. Platform-owned — do not rewrite.
 * No service-worker registration here (preview must stay SW-free).
 */
export default function InstallPage() {
  const enabled = Boolean(pwaConfig?.enabled);
  const [installed, setInstalled] = useState(isStandalone);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const platform = useMemo(detectPlatform, []);
  const steps = PLATFORM_STEPS[platform] ?? PLATFORM_STEPS.desktop;

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      window.__joorchinTelemetry?.report?.({
        type: 'pwa_install_prompt_shown',
        message: 'beforeinstallprompt',
      });
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.__joorchinTelemetry?.report?.({
        type: 'pwa_installed',
        message: 'appinstalled',
      });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
  };

  if (!enabled) {
    return (
      <PageShell>
        <GuideHeader />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900">نصب اپ فعال نیست</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600">صاحب سایت این قابلیت را خاموش کرده است.</p>
      </PageShell>
    );
  }

  if (installed) {
    return (
      <PageShell>
        <GuideHeader />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900">نصب شد</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          این سایت مثل یک اپ روی دستگاه شما باز شده.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl bg-brand-500 text-sm font-semibold text-on-brand-500 transition-colors duration-200 hover:bg-brand-400"
        >
          بازگشت
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <GuideHeader />

      <div className="mt-8 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/10">
          <Smartphone className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.2em] text-zinc-400">INSTALL APP</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
            دسترسی سریع‌تر
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">
            سایت را روی صفحهٔ اصلی نصب کنید تا همیشه با یک لمس، سریع و بدون باز کردن مرورگر
            در دسترس باشد.
          </p>
        </div>
      </div>

      {deferredPrompt ? (
        <button
          type="button"
          onClick={install}
          className="mt-7 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl bg-brand-500 text-sm font-semibold text-on-brand-500 transition-colors duration-200 hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
        >
          نصب
        </button>
      ) : null}

      <section aria-labelledby="install-steps" className="mt-8">
        <h2 id="install-steps" className="text-xs font-medium tracking-[0.16em] text-zinc-400">
          مراحل
        </h2>
        <ol className="mt-4 space-y-3">
          {steps.map((text, index) => (
            <li
              key={index}
              className="flex items-start gap-4 rounded-[1.35rem] border border-zinc-200 bg-zinc-50/80 px-4 py-4 transition-colors duration-200 hover:bg-zinc-100/80"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/12 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/12">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-7 text-zinc-700">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8 flex items-start gap-2 border-t border-zinc-200 pt-5 text-xs leading-6 text-zinc-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        نیاز به HTTPS دارد. پرداخت آفلاین پشتیبانی نمی‌شود.
      </p>
    </PageShell>
  );
}

function GuideHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex h-8 items-center rounded-full bg-brand-500/10 px-3 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/10">
        نصب اپ
      </span>
      <Link
        to="/"
        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 transition-colors duration-200 hover:text-zinc-900"
      >
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        بازگشت
      </Link>
    </div>
  );
}
