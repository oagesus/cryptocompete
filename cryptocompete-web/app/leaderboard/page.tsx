import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { getTimezone } from "@/lib/timezone/get-timezone";
import { LeaderboardClient } from "./leaderboard-client";

export const dynamic = "force-dynamic";

function calculateMinutesUntilNextHour(timezone: string): number {
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const nextHour = new Date(nowInTz);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const diff = nextHour.getTime() - nowInTz.getTime();
  return Math.ceil(diff / 1000 / 60);
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();
  const timezone = await getTimezone();
  const calculatedAt = leaderboard.entries[0]?.calculatedAt ?? null;
  const initialMinutes = calculateMinutesUntilNextHour(timezone);

  return (
    <LeaderboardClient
      initialEntries={leaderboard.entries}
      initialCurrency={leaderboard.currency}
      initialExchangeRate={leaderboard.exchangeRate}
      initialCalculatedAt={calculatedAt}
      initialMinutes={initialMinutes}
      timezone={timezone}
    />
  );
}