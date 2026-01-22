import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface KlineResponse {
  symbol: string;
  timeframe: string;
  interval: string;
  klines: Kline[];
  fromCache: boolean;
  fetchedAt: string;
}

export type KlineTimeframe = "1D" | "7D" | "1M" | "3M" | "1Y" | "YTD";

export async function getKlines(
  symbol: string,
  timeframe: KlineTimeframe = "1D"
): Promise<KlineResponse | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(
      `${API_URL}/api/cryptocurrencies/${symbol}/klines?timeframe=${timeframe}`,
      {
        cache: "no-store",
        headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}