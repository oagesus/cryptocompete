"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AccountProvider, useAccount } from "@/components/account-provider";
import { AccountSidebar } from "@/components/account-sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function SidebarSkeleton() {
  return (
    <Card className="h-fit">
      <CardContent className="space-y-1">
        <div className="pb-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted mx-3" />
        </div>
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
        <div className="py-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted mx-3" />
        </div>
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function AccountLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { accountData, isLoading } = useAccount();

  if (isLoading) {
    const isProfilePage = pathname.startsWith("/account/profiles");

    return (
      <div className="flex flex-1">
        <div className="flex w-full gap-6">
          <div className="w-64 shrink-0">
            <SidebarSkeleton />
          </div>
          <div className="flex-1">
            {isProfilePage ? <ProfileSkeleton /> : <SettingsSkeleton />}
          </div>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return null;
  }

  return (
    <div className="flex flex-1">
      <div className="flex w-full gap-6">
        <div className="w-64 shrink-0">
          <AccountSidebar profiles={accountData.profiles} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <AccountLayoutContent>{children}</AccountLayoutContent>
    </AccountProvider>
  );
}