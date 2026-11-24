import { useEffect, useState } from 'react';

/**
 * Platform attribution — mounted from main.jsx on every generated site.
 * Do not remove or re-implement in App.jsx / site Footer (would duplicate).
 *
 * Bottom-left dock, above the PWA install card (10px gap). Shared CSS
 * variables on :root keep the two overlays aligned without a shared parent.
 *
 * Self-contained on purpose: generated apps rewrite index.css / Tailwind
 * config freely, so this badge ships its own scoped <style> and never
 * depends on site CSS. Keep it that way.
 */
const JOORCHIN_ORIGIN = "https://joorchin.ai";

/** Landing URL with a back-reference to the site that sent the click. */
function joorchinHref() {
  const url = new URL(JOORCHIN_ORIGIN);
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host) url.searchParams.set("ref", host);
    const appId = import.meta.env.VITE_APP_ID;
    if (appId) url.searchParams.set("app", String(appId));
  }
  url.searchParams.set("utm_source", "built_by");
  url.searchParams.set("utm_medium", "badge");
  url.searchParams.set("utm_campaign", "built_with_joorchin");
  return url.toString();
}

/* Jigsaw-piece brand mark: knob on top, socket on the right. */
function PuzzleMark() {
  return (
    <svg
      className="jrchbb-mark"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 6.5h3.1a2.6 2.6 0 1 1 3.8 0H17A2.5 2.5 0 0 1 19.5 9v2.4a2.4 2.4 0 1 0 0 4.1V18a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18V9A2.5 2.5 0 0 1 7 6.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

const STYLE = `
:root {
  --jrch-dock-left: 16px;
  --jrch-dock-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  --jrch-dock-gap: 10px;
  --jrch-badge-height: 36px;
  --jrch-pwa-height: 56px;
  --jrch-pwa-extra: calc(var(--jrch-pwa-height) + var(--jrch-dock-gap));
  --jrch-dock-max: 20rem;
}
.jrchbb-root {
  position: fixed;
  left: var(--jrch-dock-left);
  bottom: calc(
    var(--jrch-dock-bottom) +
      var(--jrch-pwa-extra, calc(var(--jrch-pwa-height) + var(--jrch-dock-gap)))
  );
  z-index: 40;
  display: flex;
  width: auto;
  max-width: var(--jrch-dock-max);
  box-sizing: border-box;
  direction: rtl;
  font-family: "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif;
  transition: bottom 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.jrchbb-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--jrch-badge-height);
  padding-inline: 9px;
  border-radius: 999px;
  background: #101917;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 10px rgba(4, 12, 10, 0.35);
  color: #eef5f2;
  text-decoration: none;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.jrchbb-pill:hover {
  background: #16211e;
  box-shadow: 0 6px 12px rgba(4, 12, 10, 0.4);
}
.jrchbb-pill:focus-visible {
  outline: 2px solid #7fd6bd;
  outline-offset: 3px;
}
.jrchbb-mark {
  color: #7fd6bd;
  flex: none;
}
.jrchbb-label {
  font-weight: 500;
  color: #cfe0da;
}
.jrchbb-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  max-width: 0;
  height: 28px;
  padding-inline: 0;
  border-radius: 999px;
  background: transparent;
  opacity: 0;
  margin-inline-start: 0;
  color: #0d1f1a;
  font-weight: 700;
  white-space: nowrap;
  transition:
    max-width 240ms cubic-bezier(0.16, 1, 0.3, 1),
    padding-inline 240ms cubic-bezier(0.16, 1, 0.3, 1),
    background 180ms ease,
    opacity 180ms ease,
    margin-inline-start 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.jrchbb-pill:hover .jrchbb-cta,
.jrchbb-pill:focus-visible .jrchbb-cta,
.jrchbb-pill:focus-within .jrchbb-cta {
  max-width: 8.5rem;
  padding-inline: 12px;
  background: #7fd6bd;
  opacity: 1;
  margin-inline-start: 6px;
}
@media (prefers-reduced-motion: reduce) {
  .jrchbb-pill {
    transition: none;
  }
  .jrchbb-cta {
    transition: none;
  }
}
`;

export default function JoorchinBuiltBy() {
  const href = joorchinHref();
  const [pwaBannerPresent, setPwaBannerPresent] = useState(false);
  const [hiddenWhileBuilding, setHiddenWhileBuilding] = useState(false);

  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data;
      if (data?.type === 'joorchin:building') {
        setHiddenWhileBuilding(data.active === true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const selector = '[data-joorchin-pwa-install-banner="1"]';

    const compute = () => {
      setPwaBannerPresent(Boolean(document.querySelector(selector)));
    };

    compute();

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    const obs = new MutationObserver(schedule);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const pwaExtra = pwaBannerPresent
    ? 'calc(var(--jrch-pwa-height) + var(--jrch-dock-gap))'
    : '10px';

  if (hiddenWhileBuilding) return null;

  return (
    <div
      lang="fa"
      dir="rtl"
      className="joorchin-built-by jrchbb-root"
      data-joorchin-platform="built-by"
      style={{ ['--jrch-pwa-extra']: pwaExtra }}
    >
      <style>{STYLE}</style>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="jrchbb-pill"
        aria-label="این سایت با جورچین ساخته شده — شما هم سایت خودتان را با هوش مصنوعی بسازید"
      >
        <PuzzleMark />
        <span className="jrchbb-label">ساخته‌شده با جورچین</span>
        <span className="jrchbb-cta">شما هم بسازید</span>
      </a>
    </div>
  );
}
