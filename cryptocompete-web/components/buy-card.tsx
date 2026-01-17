"use client";

import { Input } from "@/components/ui/input";

interface BuyCardProps {
  value: string;
  symbol: string;
  onChange: (value: string) => void;
}

export function BuyCard({ value, symbol, onChange }: BuyCardProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">You Buy</span>
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