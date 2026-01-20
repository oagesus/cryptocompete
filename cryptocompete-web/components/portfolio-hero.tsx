"use client";

import { useMemo } from "react";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { ProfitLossBadge } from "@/components/profit-loss-badge";

interface Holding {
  symbol: string;
  amount: number;
  priceUsd: number | null;
  investedValue: number;
}

interface PortfolioHeroProps {
  balance: number;
  holdings: Holding[];
  currency: string;
  exchangeRate: number;
}

export function PortfolioHero({
  balance,
  holdings,
  currency,
  exchangeRate,
}: PortfolioHeroProps) {
  const { prices } = useCryptoPrices();

  const { holdingsValue, totalInvested } = useMemo(() => {
    let holdingsVal = 0;
    let invested = 0;

    holdings.forEach((holding) => {
      const livePrice = prices[holding.symbol];
      const priceUsd = livePrice?.price ?? holding.priceUsd;
      const value = priceUsd ? holding.amount * priceUsd * exchangeRate : 0;
      holdingsVal += value;
      invested += holding.investedValue;
    });

    return { holdingsValue: holdingsVal, totalInvested: invested };
  }, [holdings, prices, exchangeRate]);

  const totalValue = balance + holdingsValue;
  const profitLoss = totalValue - (balance + totalInvested);
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(totalValue);

  const formattedProfitLoss = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    signDisplay: "always",
  }).format(profitLoss);

  return (
    <div className="flex flex-col items-center py-6 px-6">
      <span className="text-sm text-muted-foreground mb-1">Total Value</span>
      <span className="text-4xl font-bold tracking-tight">{formattedTotal}</span>
      {holdings.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <ProfitLossBadge percent={profitLossPercent} />
          <span className="text-sm text-muted-foreground">
            ({formattedProfitLoss})
          </span>
        </div>
      )}
    </div>
  );
}