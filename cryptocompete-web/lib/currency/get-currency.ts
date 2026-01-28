import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface CurrencyInfo {
  currency: string;
  supportedCurrencies: string[];
}

export async function getCurrency(): Promise<CurrencyInfo> {
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get("display_currency")?.value;

  try {
    const response = await fetch(`${API_URL}/api/currency`, {
      headers: displayCurrency ? { Cookie: `display_currency=${displayCurrency}` } : {},
      cache: "no-store",
    });

    if (!response.ok) {
      return { currency: "EUR", supportedCurrencies: ["EUR", "USD", "GBP", "CHF", "JPY", "CNY", "AUD", "CAD"] };
    }

    return response.json();
  } catch {
    return { currency: "EUR", supportedCurrencies: ["EUR", "USD", "GBP", "CHF", "JPY", "CNY", "AUD", "CAD"] };
  }
}