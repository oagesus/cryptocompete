import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Cryptocurrency {
  symbol: string;
  name: string;
  price: number | null;
}

export interface CryptocurrencyDetail {
  symbol: string;
  name: string;
  price: number | null;
  changePercent24h: number | null;
  currency: string;
  exchangeRate: number;
}

export async function getAllCryptocurrencies(): Promise<Cryptocurrency[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(`${API_URL}/api/cryptocurrencies/all`, {
      cache: "no-store",
      headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

export async function getCryptocurrency(symbol: string): Promise<CryptocurrencyDetail | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(`${API_URL}/api/cryptocurrencies/${symbol}`, {
      cache: "no-store",
      headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}