/**
 * Plugin-owned i18n behaviour, shipped in the base image so App.jsx can
 * statically import it. Activation is the plugins.js manifest, not the
 * module graph. Locale JSON always exists in the template so vite build
 * can resolve this chunk on every app.
 */
import { useMemo, useState } from "react";
import en from "@/locales/en.json";
import fa from "@/locales/fa.json";
import { I18nContext } from "@/lib/i18n-context";

const catalogs = { en, fa };

export function I18nProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocale] = useState(defaultLocale);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      unavailable: false,
      t: (key) => {
        const parts = String(key).split(".");
        let node = catalogs[locale] || catalogs.en;
        for (const part of parts) node = node?.[part];
        return node ?? key;
      },
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export default I18nProvider;
