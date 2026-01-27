"use client";

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
}

export function LeaderboardList({ entries, currency, exchangeRate }: LeaderboardListProps) {
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

  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground block mb-3">{t("rankedByPortfolioValue")}</span>
      {entries.map((entry) => {
        const isTopThree = entry.rank <= 3;
        const formattedValue = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency,
        }).format(entry.totalValue * exchangeRate);

        return (
          <div
            key={entry.profilePublicId}
            className="flex flex-col md:flex-row md:items-center md:justify-between py-3 px-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                  isTopThree
                    ? `${rankBgStyles[entry.rank]} ${rankTextStyles[entry.rank]}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {entry.rank}
              </div>
              <span className="text-sm font-medium truncate">{entry.username}</span>
            </div>
            <span className="text-sm font-medium shrink-0 ml-9 md:ml-0">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}