"use client";

import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfitLossBadgeProps {
  percent: number;
}

export function ProfitLossBadge({ percent }: ProfitLossBadgeProps) {
  const locale = useLocale();
  const isPositive = percent >= 0;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(percent);

  return (
    <Badge
      className={`flex items-center gap-0.5 transition-none ${
        isPositive
          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400"
          : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {formatted}%
    </Badge>
  );
}