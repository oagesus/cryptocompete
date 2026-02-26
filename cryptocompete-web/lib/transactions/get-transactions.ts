import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Transaction {
  id: number;
  symbol: string;
  name: string;
  type: "Buy" | "Sell";
  amount: number;
  amountRaw: string;
  pricePerUnit: number;
  pricePerUnitRaw: string;
  totalValue: number;
  currency: string;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  currency: string;
  exchangeRate: number;
  rank?: number | null;
}

export async function getTransactions(
  profilePublicId: string
): Promise<TransactionsResponse | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const displayCurrency = cookieStore.get("display_currency")?.value;

  if (!accessToken) {
    return null;
  }

  const cookieHeader: string[] = [`access_token=${accessToken}`];
  if (displayCurrency) cookieHeader.push(`display_currency=${displayCurrency}`);

  try {
    const response = await fetch(
      `${API_URL}/api/portfolios/${profilePublicId}/transactions`,
      {
        headers: {
          Cookie: cookieHeader.join("; "),
        },
        cache: "no-store",
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