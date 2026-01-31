"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { HoldingCard } from "@/components/holding-card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

interface PublicHolding {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number | null;
  investedValue: number;
}

interface PublicHoldingsListProps {
  holdings: PublicHolding[];
  currency: string;
  exchangeRate: number;
}

export function PublicHoldingsList({ holdings, currency, exchangeRate }: PublicHoldingsListProps) {
  const { prices } = useCryptoPrices();
  const t = useTranslations("leaderboard");

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">
            {t("noHoldingsYet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {holdings.map((holding) => {
        const livePrice = prices[holding.symbol];
        const priceUsd = livePrice?.price ?? holding.priceUsd;
        
        let currentValue: number | undefined;
        let profitLossPercent: number | undefined;

        if (priceUsd) {
          currentValue = holding.amount * priceUsd * exchangeRate;
          if (holding.investedValue > 0) {
            profitLossPercent = ((currentValue - holding.investedValue) / holding.investedValue) * 100;
          }
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