/**
 * Platform-owned i18n fallback contract. Identity lives here so a failed
 * plugin load cannot mint a second Error class or a silently-succeeding locale
 * switch (a no-op setLocale would look like the language changed while copy
 * stayed English).
 */

export class I18nUnavailableError extends Error {
  constructor(message = "i18n is temporarily unavailable") {
    super(message);
    this.name = "I18nUnavailableError";
  }
}

/**
 * Reads degrade (t returns the key); writes throw.
 */
export function createNullI18nValue() {
  return {
    locale: "en",
    unavailable: true,
    t: (key) => String(key ?? ""),
    setLocale: () => {
      throw new I18nUnavailableError();
    },
  };
}
