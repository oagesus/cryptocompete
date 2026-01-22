import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Cryptocurrency {
  symbol: string;
  name: string;
  priceUsd: number | null;
  changePercent24h: number | null;
  rank: number | null;
  percentChange7d: number | null;
  percentChange30d: number | null;
  percentChange90d: number | null;
}

export interface CryptocurrencyListResponse {
  cryptocurrencies: Cryptocurrency[];
  currency: string;
  exchangeRate: number;
}

export interface CryptocurrencyDetail {
  symbol: string;
  name: string;
  priceUsd: number | null;
  changePercent24h: number | null;
  currency: string;
  exchangeRate: number;
  percentChange7d: number | null;
  percentChange30d: number | null;
  percentChange90d: number | null;
}

export async function getAllCryptocurrencies(): Promise<CryptocurrencyListResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(`${API_URL}/api/cryptocurrencies/all`, {
      cache: "no-store",
      headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    });

    if (!response.ok) {
      return { cryptocurrencies: [], currency: "USD", exchangeRate: 1 };
    }

    return response.json();
  } catch {
    return { cryptocurrencies: [], currency: "USD", exchangeRate: 1 };
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