import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface LeaderboardEntry {
  rank: number;
  profilePublicId: string;
  username: string;
  totalValue: number;
  calculatedAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currency: string;
  exchangeRate: number;
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getLeaderboard(page: number = 1, pageSize: number = 10): Promise<LeaderboardResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const displayCurrency = cookieStore.get("display_currency")?.value;

  const cookieHeader: string[] = [];
  if (accessToken) cookieHeader.push(`access_token=${accessToken}`);
  if (displayCurrency) cookieHeader.push(`display_currency=${displayCurrency}`);

  try {
    const response = await fetch(`${API_URL}/api/leaderboard?page=${page}&pageSize=${pageSize}`, {
      cache: "no-store",
      headers: cookieHeader.length > 0 ? { Cookie: cookieHeader.join("; ") } : {},
    });

    if (!response.ok) {
      return { entries: [], currency: "EUR", exchangeRate: 1, totalCount: 0, page: 1, pageSize };
    }

    return response.json();
  } catch {
    return { entries: [], currency: "EUR", exchangeRate: 1, totalCount: 0, page: 1, pageSize };
  }
}