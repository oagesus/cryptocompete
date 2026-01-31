import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface PublicHolding {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number | null;
  changePercent24h: number | null;
  rank: number | null;
  investedValue: number;
}

export interface PublicProfile {
  profilePublicId: string;
  username: string;
  rank: number | null;
  balance: number;
  currency: string;
  exchangeRate: number;
  holdings: PublicHolding[];
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get("display_currency")?.value;

  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard/profile/${encodeURIComponent(username)}`,
      {
        cache: "no-store",
        headers: displayCurrency ? { Cookie: `display_currency=${displayCurrency}` } : {},
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