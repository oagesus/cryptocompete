export const locales = ["de-DE", "en-US"] as const;
export type Locale = (typeof locales)[number];

export const fallbackLocale: Locale = "en-US";

export const localeNames: Record<Locale, string> = {
  "de-DE": "Deutsch",
  "en-US": "English",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";