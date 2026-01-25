"use client";

import { useEffect, useState } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardHeaderProps {
  calculatedAt: string | null;
}

function calculateMinutesUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const diff = nextHour.getTime() - now.getTime();
  return Math.ceil(diff / 1000 / 60);
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

export function LeaderboardHeader({ calculatedAt }: LeaderboardHeaderProps) {
  const [minutesUntilUpdate, setMinutesUntilUpdate] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setMinutesUntilUpdate(calculateMinutesUntilNextHour());

    update();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      update();
      interval = setInterval(update, 60000);
    }, msUntilNextMinute);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const lastUpdated = calculatedAt
    ? roundToNearestHour(new Date(calculatedAt)).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isHydrated = minutesUntilUpdate !== null;
  const minutesText = minutesUntilUpdate === 1 ? "minute" : "minutes";

  return (
    <CardHeader className="pb-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
        {lastUpdated && (
          <div className="flex flex-col text-sm text-muted-foreground md:text-right">
            {isHydrated ? (
              <>
                <span>Updated: {lastUpdated}</span>
                <span>Next update in {minutesUntilUpdate} {minutesText}</span>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-40 md:ml-auto bg-muted" />
                <Skeleton className="h-4 w-32 mt-1 md:ml-auto bg-muted" />
              </>
            )}
          </div>
        )}
      </div>
    </CardHeader>
  );
}