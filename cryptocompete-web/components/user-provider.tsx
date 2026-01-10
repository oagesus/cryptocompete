"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@/lib/auth/get-user";

interface UserContextType {
  user: User | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export function useUserOptional() {
  return useContext(UserContext);
}

interface UserProviderProps {
  children: ReactNode;
  initialData: User | null;
}

export function UserProvider({ children, initialData }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialData);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setUser(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, refetch }}>
      {children}
    </UserContext.Provider>
  );
}