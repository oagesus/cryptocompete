"use client";

import { ReactNode } from "react";
import { CryptocurrencyBuySidebar } from "@/components/cryptocurrency-buy-sidebar";
import { Cryptocurrency } from "@/lib/crypto/get-cryptocurrencies";

interface Props {
  children: ReactNode;
  cryptocurrencies: Cryptocurrency[];
  currency: string;
  exchangeRate: number;
}

export function BuyLayoutClient({ children, cryptocurrencies, currency, exchangeRate }: Props) {
  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-80">
          <CryptocurrencyBuySidebar 
            cryptocurrencies={cryptocurrencies} 
            currency={currency}
            exchangeRate={exchangeRate}
          />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}