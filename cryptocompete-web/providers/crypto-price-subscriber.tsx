"use client";

import { useEffect, useRef } from "react";
import { useCryptoPriceContext } from "@/providers/crypto-price-provider";

export function CryptoPriceSubscriber() {
  const { isConnected, subscribeToAll } = useCryptoPriceContext();
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || hasSubscribedRef.current) return;
    subscribeToAll();
    hasSubscribedRef.current = true;
  }, [isConnected, subscribeToAll]);

  return null;
}