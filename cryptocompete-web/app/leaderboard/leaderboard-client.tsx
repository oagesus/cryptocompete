"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeaderboardList } from "@/components/leaderboard-list";

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
  header: React.ReactNode;
}

export function LeaderboardClient({
  initialEntries,
  initialCurrency,
  initialExchangeRate,
  header,
}: LeaderboardClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [currency, setCurrency] = useState(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);

  useEffect(() => {
    setEntries(initialEntries);
    setCurrency(initialCurrency);
    setExchangeRate(initialExchangeRate);
  }, [initialEntries, initialCurrency, initialExchangeRate]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard?limit=100");
      if (!response.ok) return;
      const data = await response.json();
      setEntries(data.entries);
      setCurrency(data.currency);
      setExchangeRate(data.exchangeRate);
    } catch {
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 5, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      fetchLeaderboard();

      const interval = setInterval(fetchLeaderboard, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilNextHour);

    return () => clearTimeout(timeout);
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-6">
      <Card>
        {header}
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