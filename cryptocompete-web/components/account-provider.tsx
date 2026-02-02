"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth/get-user";
import { CurrencyInfo } from "@/lib/currency/get-currency";

interface AccountContextType {
  user: User;
  currencyInfo: CurrencyInfo;
  refetch: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
}

interface AccountProviderProps {
  children: ReactNode;
  initialData: User;
  initialCurrencyInfo: CurrencyInfo;
}

export function AccountProvider({ children, initialData, initialCurrencyInfo }: AccountProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialData);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/auth/clear");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch {
      router.push("/auth/clear");
    }
  }, [router]);

  return (
    <AccountContext.Provider value={{ user, currencyInfo: initialCurrencyInfo, refetch }}>
      {children}
    </AccountContext.Provider>
  );
}