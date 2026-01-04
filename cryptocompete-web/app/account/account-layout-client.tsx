"use client";

import { ReactNode } from "react";
import { AccountProvider } from "@/components/account-provider";
import { AccountSidebar } from "@/components/account-sidebar";
import { User } from "@/lib/auth/get-user";

interface Props {
  children: ReactNode;
  initialData: User;
}

export function AccountLayoutClient({ children, initialData }: Props) {
  return (
    <AccountProvider initialData={initialData}>
      <div className="flex flex-1">
        <div className="flex w-full gap-6">
          <div className="w-64 shrink-0">
            <AccountSidebar profiles={initialData.profiles} />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AccountProvider>
  );
}