import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Holding {
  symbol: string;
  name: string;
  amount: number;
  amountRaw: string;
  priceUsd: number | null;
  changePercent24h: number | null;
  rank: number | null;
  investedValue: number;
  updatedAt: string;
}

export interface Portfolio {
  profilePublicId: string;
  username: string;
  balance: number;
  currency: string;
  exchangeRate: number;
  holdings: Holding[];
}

export async function getPortfolio(publicId: string): Promise<Portfolio | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const displayCurrency = cookieStore.get("display_currency")?.value;

  if (!accessToken) {
    return null;
  }

  const cookieHeader: string[] = [`access_token=${accessToken}`];
  if (displayCurrency) cookieHeader.push(`display_currency=${displayCurrency}`);

  try {
    const response = await fetch(`${API_URL}/api/portfolios/${publicId}`, {
      headers: {
        Cookie: cookieHeader.join("; "),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}