"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface Profile {
  publicId: string;
  username: string;
  isMain: boolean;
}

export interface AccountData {
  email: string;
  connectedProviders: string[];
  profiles: Profile[];
}

interface AccountContextType {
  accountData: AccountData | null;
  isLoading: boolean;
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
}

export function AccountProvider({ children }: AccountProviderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const fetchAccountData = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAccountData({
          email: data.email,
          connectedProviders: data.connectedProviders,
          profiles: data.profiles,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  return (
    <AccountContext.Provider
      value={{ accountData, isLoading, refetch: fetchAccountData }}
    >
      {children}
    </AccountContext.Provider>
  );
}