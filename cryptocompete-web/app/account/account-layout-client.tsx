"use client";

import { ReactNode } from "react";
import { AccountProvider } from "@/components/account-provider";
import { AccountSidebar } from "@/components/account-sidebar";
import { User } from "@/lib/auth/get-user";
import { CurrencyInfo } from "@/lib/currency/get-currency";

interface Props {
  children: ReactNode;
  initialData: User;
  initialCurrencyInfo: CurrencyInfo;
}

export function AccountLayoutClient({ children, initialData, initialCurrencyInfo }: Props) {
  return (
    <AccountProvider initialData={initialData} initialCurrencyInfo={initialCurrencyInfo}>
      <div className="flex flex-1">
        <div className="flex w-full flex-col gap-6 md:flex-row">
          <div className="w-full shrink-0 md:w-80">
            <AccountSidebar />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AccountProvider>
  );
}