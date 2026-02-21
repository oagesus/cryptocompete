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
  subscribeToAll: () => void;
}

const CryptoPriceContext = createContext<CryptoPriceContextType | null>(null);

export function CryptoPriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isMountedRef = useRef(true);
  const pendingUpdatesRef = useRef<Record<string, PriceUpdate>>({});
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    updateIntervalRef.current = setInterval(() => {
      const pending = pendingUpdatesRef.current;
      if (Object.keys(pending).length > 0) {
        pendingUpdatesRef.current = {};
        setPrices((prev) => ({ ...prev, ...pending }));
      }
    }, 1000);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/prices`, {
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .build();

    connectionRef.current = connection;

    connection.on("PriceUpdate", (data: PriceUpdate) => {
      pendingUpdatesRef.current[data.symbol] = data;
    });

    const resubscribe = async () => {
      try {
        await connection.invoke("SubscribeToAll");
      } catch (err) {
        console.error("Error resubscribing to all:", err);
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
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      connection.stop();
    };
  }, []);

  const subscribeToAll = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    try {
      await connection.invoke("SubscribeToAll");
    } catch (err) {
      console.error("Error subscribing to all:", err);
    }
  }, []);

  return (
    <CryptoPriceContext.Provider value={{ prices, isConnected, subscribeToAll }}>
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