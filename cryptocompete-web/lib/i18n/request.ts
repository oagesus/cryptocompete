import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { fallbackLocale, locales, Locale, LOCALE_COOKIE } from "./config";

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, priority = "q=1"] = lang.trim().split(";");
      return {
        code: code.trim(),
        priority: parseFloat(priority.replace("q=", "")) || 1,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const { code } of languages) {
    const exactMatch = locales.find((locale) => locale.toLowerCase() === code.toLowerCase());
    if (exactMatch) return exactMatch;

    const languagePrefix = code.split("-")[0].toLowerCase();
    const prefixMatch = locales.find((locale) => locale.toLowerCase().startsWith(languagePrefix));
    if (prefixMatch) return prefixMatch;
  }

  return null;
}

const messageImports = {
  "en-US": async () => ({
    ...(await import("@/messages/en-US/nav.json")).default,
    ...(await import("@/messages/en-US/trade.json")).default,
    ...(await import("@/messages/en-US/account.json")).default,
    ...(await import("@/messages/en-US/api.json")).default,
    ...(await import("@/messages/en-US/leaderboard.json")).default,
    ...(await import("@/messages/en-US/auth.json")).default,
    ...(await import("@/messages/en-US/dashboard.json")).default,
    ...(await import("@/messages/en-US/home.json")).default,
    ...(await import("@/messages/en-US/upgrade.json")).default,
    ...(await import("@/messages/en-US/billing.json")).default,
  }),
  "de-DE": async () => ({
    ...(await import("@/messages/de-DE/nav.json")).default,
    ...(await import("@/messages/de-DE/trade.json")).default,
    ...(await import("@/messages/de-DE/account.json")).default,
    ...(await import("@/messages/de-DE/api.json")).default,
    ...(await import("@/messages/de-DE/leaderboard.json")).default,
    ...(await import("@/messages/de-DE/auth.json")).default,
    ...(await import("@/messages/de-DE/dashboard.json")).default,
    ...(await import("@/messages/de-DE/home.json")).default,
    ...(await import("@/messages/de-DE/upgrade.json")).default,
    ...(await import("@/messages/de-DE/billing.json")).default,
  }),
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  } else {
    const acceptLanguage = headerStore.get("Accept-Language");
    locale = getLocaleFromAcceptLanguage(acceptLanguage) ?? fallbackLocale;
  }

  const messages = await messageImports[locale]();

  return { locale, messages };
});