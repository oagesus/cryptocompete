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
}

export async function getLeaderboard(limit: number = 100): Promise<LeaderboardResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`, {
      cache: "no-store",
      headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    });

    if (!response.ok) {
      return { entries: [], currency: "EUR", exchangeRate: 1 };
    }

    return response.json();
  } catch {
    return { entries: [], currency: "EUR", exchangeRate: 1 };
  }
}