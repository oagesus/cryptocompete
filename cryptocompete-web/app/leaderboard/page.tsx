import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { LeaderboardClient } from "./leaderboard-client";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <LeaderboardClient
      initialEntries={leaderboard.entries}
      initialCurrency={leaderboard.currency}
      initialExchangeRate={leaderboard.exchangeRate}
    />
  );
}