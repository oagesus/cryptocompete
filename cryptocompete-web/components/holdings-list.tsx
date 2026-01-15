"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HoldingCard } from "@/components/holding-card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  price: number | null;
  currentValue: number | null;
  investedValue: number;
  profitLossPercent: number | null;
}

interface HoldingsListProps {
  holdings: Holding[];
  currency: string;
  exchangeRate: number;
}

export function HoldingsList({ holdings, currency, exchangeRate }: HoldingsListProps) {
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  const { prices } = useCryptoPrices(symbols);

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">
            No holdings yet. Start trading to build your portfolio!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {holdings.map((holding) => {
        const livePrice = prices[holding.symbol];
        
        let currentValue: number | undefined;
        let profitLossPercent: number | undefined;

        if (livePrice) {
          const convertedPrice = livePrice.price * exchangeRate;
          currentValue = holding.amount * convertedPrice;
          if (holding.investedValue > 0) {
            profitLossPercent = ((currentValue - holding.investedValue) / holding.investedValue) * 100;
          }
        } else if (holding.currentValue !== null) {
          currentValue = holding.currentValue;
          profitLossPercent = holding.profitLossPercent ?? undefined;
        }

        return (
          <HoldingCard
            key={holding.symbol}
            symbol={holding.symbol}
            name={holding.name}
            amount={holding.amount}
            currentValue={currentValue}
            profitLossPercent={profitLossPercent}
            currency={currency}
          />
        );
      })}
    </div>
  );
}