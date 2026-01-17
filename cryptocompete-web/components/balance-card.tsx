"use client";

import { Card, CardContent } from "@/components/ui/card";

interface BalanceCardProps {
  balance: number;
  currency: string;
}

export function BalanceCard({ balance, currency }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(balance);

  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Your Balance</span>
        <span className="font-semibold">{formattedBalance}</span>
      </CardContent>
    </Card>
  );
}