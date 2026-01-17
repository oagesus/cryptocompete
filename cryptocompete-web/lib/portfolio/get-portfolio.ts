import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Holding {
  symbol: string;
  name: string;
  amount: number;
  price: number | null;
  currentValue: number | null;
  investedValue: number;
  profitLossPercent: number | null;
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

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/portfolios/${publicId}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
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