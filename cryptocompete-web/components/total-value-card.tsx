"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

interface Holding {
  symbol: string;
  amount: number;
  currentValue: number | null;
}

interface TotalValueCardProps {
  balance: number;
  holdings: Holding[];
  currency: string;
  exchangeRate: number;
}

export function TotalValueCard({ 
  balance, 
  holdings, 
  currency, 
  exchangeRate 
}: TotalValueCardProps) {
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  const { prices } = useCryptoPrices(symbols);

  const holdingsValue = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const livePrice = prices[holding.symbol];
      const value = livePrice
        ? holding.amount * livePrice.price * exchangeRate
        : holding.currentValue ?? 0;
      return sum + value;
    }, 0);
  }, [holdings, prices, exchangeRate]);

  const totalValue = balance + holdingsValue;

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(totalValue);

  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Value</span>
        </div>
        <span className="text-xl font-semibold">{formattedValue}</span>
      </CardContent>
    </Card>
  );
}