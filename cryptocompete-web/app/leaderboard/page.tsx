import type { Metadata } from "next";
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { getTimezone } from "@/lib/timezone/get-timezone";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See who tops the CryptoCompete leaderboard. Compare virtual crypto portfolios and compete with traders worldwide.",
};

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 10;
const VALID_PAGE_SIZES = [10, 25, 50, 100];

function calculateMinutesUntilNextHour(timezone: string): number {
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const nextHour = new Date(nowInTz);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const diff = nextHour.getTime() - nowInTz.getTime();
  return Math.ceil(diff / 1000 / 60);
}

interface Props {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const parsedPageSize = parseInt(params.pageSize ?? "", 10);
  const pageSize = VALID_PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : DEFAULT_PAGE_SIZE;

  const leaderboard = await getLeaderboard(page, pageSize);
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
      initialTotalCount={leaderboard.totalCount}
      currentPage={page}
      currentPageSize={pageSize}
      timezone={timezone}
    />
  );
}