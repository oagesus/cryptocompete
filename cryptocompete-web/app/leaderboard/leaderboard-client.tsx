"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeaderboardList } from "@/components/leaderboard-list";
import { LeaderboardCountdown } from "@/components/leaderboard-countdown";

interface LeaderboardEntry {
  rank: number;
  profilePublicId: string;
  username: string;
  totalValue: number;
  calculatedAt: string;
}

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  initialCurrency: string;
  initialExchangeRate: number;
  initialCalculatedAt: string | null;
  initialMinutes: number;
  timezone: string;
}

function roundToNearestHour(date: Date): Date {
  const rounded = new Date(date);
  if (rounded.getMinutes() >= 59) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else if (rounded.getMinutes() === 0 && rounded.getSeconds() <= 60) {
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
}

export function LeaderboardClient({
  initialEntries,
  initialCurrency,
  initialExchangeRate,
  initialCalculatedAt,
  initialMinutes,
  timezone,
}: LeaderboardClientProps) {
  const t = useTranslations("leaderboard");
  const locale = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [currency, setCurrency] = useState(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);
  const [calculatedAt, setCalculatedAt] = useState(initialCalculatedAt);

  useEffect(() => {
    setEntries(initialEntries);
    setCurrency(initialCurrency);
    setExchangeRate(initialExchangeRate);
    setCalculatedAt(initialCalculatedAt);
  }, [initialEntries, initialCurrency, initialExchangeRate, initialCalculatedAt]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard?limit=100");
      if (!response.ok) return;
      const data = await response.json();
      setEntries(data.entries);
      setCurrency(data.currency);
      setExchangeRate(data.exchangeRate);
      if (data.entries.length > 0 && data.entries[0].calculatedAt) {
        setCalculatedAt(data.entries[0].calculatedAt);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 5, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();

    let interval: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      fetchLeaderboard();
      interval = setInterval(fetchLeaderboard, 60 * 60 * 1000);
    }, msUntilNextHour);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  const lastUpdated = calculatedAt
    ? roundToNearestHour(new Date(calculatedAt)).toLocaleString(locale, {
        timeZone: timezone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <div className="flex flex-col text-sm text-muted-foreground md:text-right">
              <span>
                {lastUpdated
                  ? t("updated", { date: lastUpdated })
                  : t("notYetUpdated")}
              </span>
              <LeaderboardCountdown initialMinutes={initialMinutes} />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <LeaderboardList
            entries={entries}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        </CardContent>
      </Card>
    </div>
  );
}