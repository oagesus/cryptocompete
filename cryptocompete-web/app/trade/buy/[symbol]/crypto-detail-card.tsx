"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { ProfitLossBadge } from "@/components/profit-loss-badge";

interface Props {
  symbol: string;
  name: string;
  initialPriceUsd: number | null;
  initialChangePercent: number | null;
  displayCurrency: string;
  exchangeRate: number;
}

export function CryptoDetailCard({ 
  symbol, 
  name, 
  initialPriceUsd, 
  initialChangePercent,
  displayCurrency,
  exchangeRate,
}: Props) {
  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const price = priceUsd ? priceUsd * exchangeRate : null;
  const changePercent = liveData?.changePercent24h ?? initialChangePercent;

  const decimals = price && price >= 10 ? 2 : 6;
  const formattedPrice = price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: displayCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(price)
    : "Loading...";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">
          {name} ({symbol})
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="flex flex-col items-center py-6">
          <span className="text-sm text-muted-foreground mb-1">Live Price</span>
          <span className="text-4xl font-bold tracking-tight">{formattedPrice}</span>
          {changePercent !== null && (
            <div className="flex items-center gap-2 mt-2">
              <ProfitLossBadge percent={changePercent} />
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}