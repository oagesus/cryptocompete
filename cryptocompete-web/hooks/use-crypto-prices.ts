"use client";

import { useCryptoPriceContext, PriceUpdate } from "@/providers/crypto-price-provider";

export type { PriceUpdate };

export function useCryptoPrices() {
  const { prices, isConnected } = useCryptoPriceContext();
  return { prices, isConnected };
}