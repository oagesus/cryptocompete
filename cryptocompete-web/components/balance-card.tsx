"use client";

import { Wallet } from "lucide-react";
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
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Balance</span>
        </div>
        <span className="text-xl font-semibold">{formattedBalance}</span>
      </CardContent>
    </Card>
  );
}