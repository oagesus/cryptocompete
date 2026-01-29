import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { LeaderboardClient } from "./leaderboard-client";
import { LeaderboardHeader } from "@/components/leaderboard-header";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();
  const calculatedAt = leaderboard.entries[0]?.calculatedAt ?? null;

  return (
    <LeaderboardClient
      initialEntries={leaderboard.entries}
      initialCurrency={leaderboard.currency}
      initialExchangeRate={leaderboard.exchangeRate}
      header={<LeaderboardHeader calculatedAt={calculatedAt} />}
    />
  );
}