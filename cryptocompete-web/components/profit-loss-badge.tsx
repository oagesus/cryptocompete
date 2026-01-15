"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfitLossBadgeProps {
  percent: number;
}

export function ProfitLossBadge({ percent }: ProfitLossBadgeProps) {
  const isPositive = percent >= 0;

  return (
    <Badge
      className={`flex items-center gap-0.5 ${
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
      {isPositive ? "+" : ""}
      {percent.toFixed(2)}%
    </Badge>
  );
}