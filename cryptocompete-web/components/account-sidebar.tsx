"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Settings, User, Plus, Wallet, CreditCard, History } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PremiumRequiredDialog } from "@/components/premium-required-dialog";
import { PremiumTransactionDialog } from "@/components/premium-transaction-dialog";
import { ActiveBadge } from "@/components/active-badge";
import { useAccount } from "@/components/account-provider";
import { isPremium } from "@/lib/auth/user-utils";

const MAX_PROFILES_PREMIUM = 5;

export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAccount();
  const t = useTranslations("account");
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  const profiles = user.profiles;
  const activeProfileId = user.activeProfileId;
  const maxProfiles = user.maxProfiles;
  const canAddProfile = profiles.length < maxProfiles;
  const userIsPremium = isPremium(user);

  const showAddButton = userIsPremium 
    ? canAddProfile 
    : profiles.length < MAX_PROFILES_PREMIUM;

  return (
    <>
      <Card className="h-fit">
        <CardContent className="space-y-1">
          <div className="pb-2">
            <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              {t("account")}
            </span>
          </div>
          <Link
            href="/account/settings"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted min-h-[40px]",
              pathname === "/account/settings" && "bg-muted font-medium"
            )}
          >
            <Settings className="h-4 w-4" />
            {t("settings")}
          </Link>
          <Link
            href="/account/billing"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted min-h-[40px]",
              pathname === "/account/billing" && "bg-muted font-medium"
            )}
          >
            <CreditCard className="h-4 w-4" />
            {t("billing")}
          </Link>
          <div className="py-2">
            <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              {t("profiles")} ({profiles.length}/{maxProfiles})
            </span>
          </div>
          {profiles.map((profile) => {
            const profilePath = `/account/profiles/${profile.publicId}`;
            const portfolioPath = `${profilePath}/portfolio`;
            const transactionsPath = `${portfolioPath}/transactions`;
            const isProfileActive = pathname === profilePath;
            const isPortfolioActive = pathname === portfolioPath;
            const isTransactionsActive = pathname === transactionsPath;
            const isExpanded = pathname.startsWith(profilePath);

            return (
              <div key={profile.publicId} className="space-y-1">
                <Link
                  href={profilePath}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted min-h-[40px]",
                    isProfileActive && "bg-muted font-medium"
                  )}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{profile.username}</span>
                  {profile.publicId === activeProfileId && (
                    <span className="ml-auto">
                      <ActiveBadge />
                    </span>
                  )}
                </Link>
                {isExpanded && (
                  <>
                    <Link
                      href={portfolioPath}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 pl-9 text-sm hover:bg-muted min-h-[40px]",
                        isPortfolioActive && "bg-muted font-medium"
                      )}
                    >
                      <Wallet className="h-4 w-4 shrink-0" />
                      <span>{t("portfolio")}</span>
                    </Link>
                    {userIsPremium ? (
                      <Link
                        href={transactionsPath}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 pl-9 text-sm hover:bg-muted min-h-[40px]",
                          isTransactionsActive && "bg-muted font-medium"
                        )}
                      >
                        <History className="h-4 w-4 shrink-0" />
                        <span>{t("transactions")}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setShowTransactionDialog(true)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 pl-9 text-sm hover:bg-muted min-h-[40px] cursor-pointer"
                      >
                        <History className="h-4 w-4 shrink-0" />
                        <span>{t("transactions")}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {showAddButton && userIsPremium && (
            <Link href="/account/profiles/create">
              <Button
                size="sm"
                className={cn(
                  "w-full gap-2 mt-1",
                  pathname === "/account/profiles/create" && "bg-primary/90"
                )}
              >
                <Plus className="h-4 w-4" />
                {t("addProfile")}
              </Button>
            </Link>
          )}
          {showAddButton && !userIsPremium && (
            <Button
              size="sm"
              className="w-full gap-2 mt-1"
              onClick={() => setShowPremiumDialog(true)}
            >
              <Plus className="h-4 w-4" />
              {t("addProfile")}
            </Button>
          )}
        </CardContent>
      </Card>
      <PremiumRequiredDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
      />
      <PremiumTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
      />
    </>
  );
}