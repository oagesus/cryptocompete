"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import * as signalR from "@microsoft/signalr";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PriceUpdate {
  symbol: string;
  price: number;
  changePercent24h: number;
}

interface CryptoPriceContextType {
  prices: Record<string, PriceUpdate>;
  isConnected: boolean;
  subscribeToSymbols: (symbols: string[]) => void;
  unsubscribeFromSymbols: (symbols: string[]) => void;
}

const CryptoPriceContext = createContext<CryptoPriceContextType | null>(null);

export function CryptoPriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/prices`, {
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .build();

    connectionRef.current = connection;

    connection.on("PriceUpdate", (data: PriceUpdate) => {
      setPrices((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    const resubscribe = async () => {
      const symbols = Array.from(subscribedSymbolsRef.current);
      for (const symbol of symbols) {
        try {
          await connection.invoke("SubscribeToSymbol", symbol);
        } catch (err) {
          console.error(`Error resubscribing to ${symbol}:`, err);
        }
      }
    };

    connection.onreconnecting(() => {
      if (isMountedRef.current) setIsConnected(false);
    });

    connection.onreconnected(async () => {
      if (isMountedRef.current) setIsConnected(true);
      await resubscribe();
    });

    connection.onclose(async () => {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      await startConnection();
    });

    const startConnection = async () => {
      while (isMountedRef.current) {
        try {
          if (connection.state === signalR.HubConnectionState.Disconnected) {
            await connection.start();
          }
          if (isMountedRef.current) setIsConnected(true);
          await resubscribe();
          break;
        } catch (err) {
          console.error("SignalR connection error, retrying in 1 second...", err);
          if (isMountedRef.current) setIsConnected(false);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    startConnection();

    return () => {
      isMountedRef.current = false;
      connection.stop();
    };
  }, []);

  const subscribeToSymbols = useCallback(async (symbols: string[]) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    for (const symbol of symbols) {
      if (!subscribedSymbolsRef.current.has(symbol)) {
        try {
          await connection.invoke("SubscribeToSymbol", symbol);
          subscribedSymbolsRef.current.add(symbol);
        } catch (err) {
          console.error(`Error subscribing to ${symbol}:`, err);
        }
      }
    }
  }, []);

  const unsubscribeFromSymbols = useCallback(async (symbols: string[]) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    for (const symbol of symbols) {
      if (subscribedSymbolsRef.current.has(symbol)) {
        try {
          await connection.invoke("UnsubscribeFromSymbol", symbol);
          subscribedSymbolsRef.current.delete(symbol);
        } catch (err) {
          console.error(`Error unsubscribing from ${symbol}:`, err);
        }
      }
    }
  }, []);

  return (
    <CryptoPriceContext.Provider
      value={{ prices, isConnected, subscribeToSymbols, unsubscribeFromSymbols }}
    >
      {children}
    </CryptoPriceContext.Provider>
  );
}

export function useCryptoPriceContext() {
  const context = useContext(CryptoPriceContext);
  if (!context) {
    throw new Error("useCryptoPriceContext must be used within CryptoPriceProvider");
  }
  return context;
}