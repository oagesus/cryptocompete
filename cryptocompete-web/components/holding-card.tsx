"use client";

import { Card, CardContent } from "@/components/ui/card";

interface HoldingCardProps {
  symbol: string;
  name: string;
  amount: number;
}

export function HoldingCard({ symbol, name, amount }: HoldingCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-sm text-muted-foreground">
            {amount.toLocaleString("de-DE", {
              maximumFractionDigits: 8,
            })}{" "}
            {symbol}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}