"use client";

import { ReactNode } from "react";
import { CryptocurrencySellSidebar } from "@/components/cryptocurrency-sell-sidebar";

export interface HoldingItem {
  symbol: string;
  name: string;
  amount: number;
  amountRaw: string;
  priceUsd: number | null;
  changePercent24h: number | null;
  rank: number | null;
}

interface Props {
  children: ReactNode;
  holdings: HoldingItem[];
  currency: string;
  exchangeRate: number;
}

export function SellLayoutClient({ children, holdings, currency, exchangeRate }: Props) {
  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-80">
          <CryptocurrencySellSidebar 
            holdings={holdings} 
            currency={currency}
            exchangeRate={exchangeRate}
          />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}