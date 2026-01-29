"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface LeaderboardCountdownProps {
  initialMinutes: number;
}

function calculateMinutesUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const diff = nextHour.getTime() - now.getTime();
  return Math.ceil(diff / 1000 / 60);
}

export function LeaderboardCountdown({ initialMinutes }: LeaderboardCountdownProps) {
  const t = useTranslations("leaderboard");
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      setMinutes(calculateMinutesUntilNextHour());
      interval = setInterval(() => {
        setMinutes(calculateMinutesUntilNextHour());
      }, 60000);
    }, msUntilNextMinute);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setMinutes(calculateMinutesUntilNextHour());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const unit = minutes === 1 ? t("minute") : t("minutes");

  return <span>{t("nextUpdateIn", { minutes, unit })}</span>;
}