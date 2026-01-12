"use client";

import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
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