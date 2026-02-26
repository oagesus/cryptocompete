"use client";

import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

interface BalanceCardProps {
  balance: number;
  currency: string;
}

export function BalanceCardPortfolio({ balance, currency }: BalanceCardProps) {
  const locale = useLocale();

  const formattedBalance = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(balance);

  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">{currency}</span>
        <span className="font-semibold">{formattedBalance}</span>
      </CardContent>
    </Card>
  );
}