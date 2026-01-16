"use client";

import { ReactNode } from "react";
import { CryptocurrencySidebar } from "@/components/cryptocurrency-sidebar";
import { Cryptocurrency } from "@/lib/crypto/get-cryptocurrencies";

interface Props {
  children: ReactNode;
  cryptocurrencies: Cryptocurrency[];
}

export function TradeLayoutClient({ children, cryptocurrencies }: Props) {
  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-80">
          <CryptocurrencySidebar cryptocurrencies={cryptocurrencies} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}