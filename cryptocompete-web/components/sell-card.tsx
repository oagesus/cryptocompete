"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface SellCardProps {
  value: string;
  symbol: string;
  onChange: (value: string) => void;
}

export function SellCard({ value, symbol, onChange }: SellCardProps) {
  const t = useTranslations("trade");

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">{t("youSell")}</span>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-16"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
      </div>
    </div>
  );
}