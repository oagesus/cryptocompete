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
        <div className="flex w-full flex-col gap-6 md:flex-row">
          <div className="w-full shrink-0 md:w-64">
            <AccountSidebar profiles={initialData.profiles} />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AccountProvider>
  );
}