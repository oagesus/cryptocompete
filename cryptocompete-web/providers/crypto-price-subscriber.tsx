"use client";

import { useEffect, useRef } from "react";
import { useCryptoPriceContext } from "@/providers/crypto-price-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function CryptoPriceSubscriber() {
  const { isConnected, subscribeToSymbols } = useCryptoPriceContext();
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || hasSubscribedRef.current) return;

    const subscribeToAll = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cryptocurrencies/all`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const symbols = data.cryptocurrencies.map((c: { symbol: string }) => c.symbol);
          subscribeToSymbols(symbols);
          hasSubscribedRef.current = true;
        }
      } catch (error) {
        console.error("Error subscribing to all cryptocurrencies:", error);
      }
    };

    subscribeToAll();
  }, [isConnected, subscribeToSymbols]);

  return null;
}