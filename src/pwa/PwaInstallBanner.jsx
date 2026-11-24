import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { pwaConfig } from '../config/pwa';

/**
 * Dismissible install hint. Preview: link to /install only (no SW).
 * Sits at the bottom of the bottom-left dock, under JoorchinBuiltBy.
 */
export default function PwaInstallBanner() {
  const location = useLocation();
  const isDevPreview = import.meta.env.DEV;
  const [hidden, setHidden] = useState(true);
  const [canPrompt, setCanPrompt] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (!pwaConfig?.enabled) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (!isDevPreview) {
      try {
        if (sessionStorage.getItem('joorchin-pwa-banner-dismissed')) return;
      } catch {
        /* ignore */
      }
    }
    setHidden(false);
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
      setCanPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || !pwaConfig?.enabled) return null;
  if (location.pathname === '/install' || location.pathname.endsWith('/install')) return null;

  const dismiss = () => {
    setHidden(true);
    if (isDevPreview) return;
    try {
      sessionStorage.setItem('joorchin-pwa-banner-dismissed', '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    dismiss();
  };

  const ctaClass =
    'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-500 px-3.5 text-xs font-semibold text-on-brand-500 transition-colors duration-200 hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40';

  return (
    <div
      dir="rtl"
      data-joorchin-pwa-install-banner="1"
      className="pointer-events-none fixed z-[41] left-[var(--jrch-dock-left,16px)] bottom-[var(--jrch-dock-bottom,16px)]"
    >
      <div
        role="region"
        aria-label="نصب اپ"
        className="pointer-events-auto flex w-[min(20rem,calc(100vw-2rem))] items-center gap-2.5 rounded-2xl border border-white/10 bg-[#101917] p-2.5 shadow-[0_4px_10px_rgba(4,12,10,0.35)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-4 text-white">نصب روی گوشی</p>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-zinc-400">دسترسی سریع‌تر</p>
        </div>

        {canPrompt ? (
          <button type="button" onClick={install} className={ctaClass}>
            نصب
          </button>
        ) : (
          <Link to="/install" className={ctaClass}>
            نصب
          </Link>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="بستن"
          className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 hover:bg-white/10 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
