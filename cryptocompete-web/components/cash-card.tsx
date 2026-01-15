"use client";

import { Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CashCardProps {
  balance: number;
  currency: string;
}

export function CashCard({ balance, currency }: CashCardProps) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(balance);

  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cash</span>
        </div>
        <span className="font-semibold">{formattedBalance}</span>
      </CardContent>
    </Card>
  );
}