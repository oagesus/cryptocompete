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

export type AllKlinesData = Record<KlineTimeframe, Kline[]>;

const ALL_TIMEFRAMES: KlineTimeframe[] = ["1D", "7D", "1M", "3M", "1Y", "YTD"];

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

export async function getAllKlines(symbol: string): Promise<AllKlinesData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const results = await Promise.all(
    ALL_TIMEFRAMES.map(async (timeframe) => {
      try {
        const response = await fetch(
          `${API_URL}/api/cryptocurrencies/${symbol}/klines?timeframe=${timeframe}`,
          {
            cache: "no-store",
            headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
          }
        );

        if (!response.ok) {
          return { timeframe, klines: [] };
        }

        const data: KlineResponse = await response.json();
        return { timeframe, klines: data.klines };
      } catch {
        return { timeframe, klines: [] };
      }
    })
  );

  const allKlines: AllKlinesData = {
    "1D": [],
    "7D": [],
    "1M": [],
    "3M": [],
    "1Y": [],
    "YTD": [],
  };

  for (const result of results) {
    allKlines[result.timeframe as KlineTimeframe] = result.klines;
  }

  return allKlines;
}