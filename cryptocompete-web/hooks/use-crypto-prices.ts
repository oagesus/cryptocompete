"use client";

import { useEffect } from "react";
import { useCryptoPriceContext, PriceUpdate } from "@/providers/crypto-price-provider";

export type { PriceUpdate };

export function useCryptoPrices(symbols?: string[]) {
  const { prices, isConnected, subscribeToSymbols, unsubscribeFromSymbols } = useCryptoPriceContext();

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;
    if (!isConnected) return;

    subscribeToSymbols(symbols);

    return () => {
      unsubscribeFromSymbols(symbols);
    };
  }, [symbols?.join(","), isConnected]);

  return { prices, isConnected };
}