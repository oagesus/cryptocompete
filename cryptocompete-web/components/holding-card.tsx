"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { ProfitLossBadge } from "@/components/profit-loss-badge";
import { DelistedBadge } from "@/components/delisted-badge";
import { getLocaleSeparators, formatRawAmount } from "@/lib/format/format-number";

interface HoldingCardProps {
  symbol: string;
  name: string;
  amount: number;
  amountRaw?: string;
  currentValue?: number;
  profitLossPercent?: number;
  currency: string;
  isDelisted?: boolean;
}

export function HoldingCard({
  symbol,
  name,
  amount,
  amountRaw,
  currentValue,
  profitLossPercent,
  currency,
  isDelisted = false,
}: HoldingCardProps) {
  const t = useTranslations("account");
  const locale = useLocale();
  const { group: groupSep, decimal: decimalSep } = getLocaleSeparators(locale);

  const formattedAmount = amountRaw
    ? formatRawAmount(amountRaw, groupSep, decimalSep, 8, true)
    : amount.toLocaleString(locale, { maximumFractionDigits: 8 });

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
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {isDelisted && <DelistedBadge />}
          </div>
          <span className="text-sm text-muted-foreground">
            {symbol}{" "}
            {formattedAmount}
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