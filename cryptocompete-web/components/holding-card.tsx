"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { ProfitLossBadge } from "@/components/profit-loss-badge";

interface HoldingCardProps {
  symbol: string;
  name: string;
  amount: number;
  currentValue?: number;
  profitLossPercent?: number;
  currency: string;
}

export function HoldingCard({
  symbol,
  name,
  amount,
  currentValue,
  profitLossPercent,
  currency,
}: HoldingCardProps) {
  const t = useTranslations("account");
  const locale = useLocale();

  const formattedValue = currentValue
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
      }).format(currentValue)
    : null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-sm text-muted-foreground">
            {symbol}{" "}
            {amount.toLocaleString(locale, {
              maximumFractionDigits: 8,
            })}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {formattedValue ? (
            <>
              {profitLossPercent !== undefined && (
                <ProfitLossBadge percent={profitLossPercent} />
              )}
              <span className="font-semibold">{formattedValue}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{t("loading")}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}