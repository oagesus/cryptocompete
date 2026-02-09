"use client";

import { PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionTypeBadgeProps {
  type: "Buy" | "Sell";
  label: string;
}

export function TransactionTypeBadge({ type, label }: TransactionTypeBadgeProps) {
  const isBuy = type === "Buy";

  return (
    <Badge
      className={`flex items-center gap-0.5 ${
        isBuy
          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400"
          : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      {isBuy ? (
        <PlusCircle className="h-3 w-3" />
      ) : (
        <MinusCircle className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );
}