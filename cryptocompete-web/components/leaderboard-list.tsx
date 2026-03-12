"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  profilePublicId: string;
  username: string;
  totalValue: number;
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currency: string;
  exchangeRate: number;
  hideSubtitle?: boolean;
  leaderboardParams?: string;
}

export function LeaderboardList({ entries, currency, exchangeRate, hideSubtitle, leaderboardParams }: LeaderboardListProps) {
  const t = useTranslations("leaderboard");
  const locale = useLocale();

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">
            {t("noDataYet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const rankBgStyles: Record<number, string> = {
    1: "bg-yellow-500/20",
    2: "bg-gray-400/20",
    3: "bg-amber-600/20",
  };

  const rankTextStyles: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  const getRankSize = (rank: number) => {
    if (rank < 100) return "w-6 text-sm";
    if (rank < 1000) return "w-7 text-xs";
    return "w-auto min-w-8 px-1.5 text-xs";
  };

  return (
    <div className="space-y-1">
      {!hideSubtitle && (
        <span className="text-sm text-muted-foreground block mb-3">{t("rankedByPortfolioValue")}</span>
      )}
      {entries.map((entry) => {
        const isTopThree = entry.rank <= 3;
        const formattedValue = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency,
        }).format(entry.totalValue * exchangeRate);

        return (
          <Link
            key={entry.profilePublicId}
            href={`/leaderboard/${encodeURIComponent(entry.username)}${leaderboardParams ? `?${leaderboardParams}` : ""}`}
            className="block"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-3 rounded-md hover:bg-muted">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "flex h-6 items-center justify-center rounded-full font-bold shrink-0",
                    getRankSize(entry.rank),
                    isTopThree
                      ? `${rankBgStyles[entry.rank]} ${rankTextStyles[entry.rank]}`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {entry.rank}
                </div>
                <span className="text-sm font-medium truncate">{entry.username}</span>
              </div>
              <span className="text-sm font-medium shrink-0 ml-9 sm:ml-0">{formattedValue}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}