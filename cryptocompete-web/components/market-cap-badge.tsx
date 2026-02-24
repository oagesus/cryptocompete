"use client";

import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface MarketCapBadgeProps {
  value: number;
  currency: string;
}

export function MarketCapBadge({ value, currency }: MarketCapBadgeProps) {
  const t = useTranslations("trade");
  const locale = useLocale();

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <Badge className="flex items-center gap-0.5 bg-muted text-muted-foreground hover:bg-muted transition-none">
      {t("marketCap")}: {formatted}
    </Badge>
  );
}