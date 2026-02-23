"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { HoldingCard } from "@/components/holding-card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  amountRaw?: string;
  priceUsd: number | null;
  investedValue: number;
  isDelisted: boolean;
  delistedValueInUserCurrency?: number | null;
}

interface HoldingsListProps {
  holdings: Holding[];
  currency: string;
  exchangeRate: number;
}

export function HoldingsList({ holdings, currency, exchangeRate }: HoldingsListProps) {
  const { prices } = useCryptoPrices();
  const t = useTranslations("account");

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
        let currentValue: number | undefined;
        let profitLossPercent: number | undefined;

        if (holding.isDelisted) {
          if (holding.delistedValueInUserCurrency != null) {
            currentValue = holding.delistedValueInUserCurrency;
          }
        } else {
          const livePrice = prices[holding.symbol];
          const priceUsd = livePrice?.price ?? holding.priceUsd;

          if (priceUsd) {
            currentValue = holding.amount * priceUsd * exchangeRate;
            if (holding.investedValue > 0) {
              profitLossPercent = ((currentValue - holding.investedValue) / holding.investedValue) * 100;
            }
          }
        }

        return (
          <HoldingCard
            key={holding.symbol}
            symbol={holding.symbol}
            name={holding.name}
            amount={holding.amount}
            amountRaw={holding.amountRaw}
            currentValue={currentValue}
            profitLossPercent={profitLossPercent}
            currency={currency}
            isDelisted={holding.isDelisted}
          />
        );
      })}
    </div>
  );
}