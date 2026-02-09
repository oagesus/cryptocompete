import { cookies } from "next/headers";
import { TransactionsResponse } from "@/lib/transactions/get-transactions";

const API_URL = process.env.API_URL;

export async function getPublicTransactions(
  username: string
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
      `${API_URL}/api/leaderboard/profile/${encodeURIComponent(username)}/transactions`,
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