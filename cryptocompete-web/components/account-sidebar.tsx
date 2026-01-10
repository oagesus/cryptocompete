"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User, Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PremiumRequiredDialog } from "@/components/premium-required-dialog";
import { ActiveBadge } from "@/components/active-badge";
import { useAccount } from "@/components/account-provider";
import { isPremium } from "@/lib/auth/user-utils";

const MAX_PROFILES_PREMIUM = 5;

export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAccount();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

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
              Account
            </span>
          </div>
          <Link
            href="/account/settings"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted min-h-[40px]",
              pathname === "/account/settings" && "bg-muted font-medium"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <div className="py-2">
            <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Profiles ({profiles.length}/{maxProfiles})
            </span>
          </div>
          {profiles.map((profile) => (
            <Link
              key={profile.publicId}
              href={`/account/profiles/${profile.publicId}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted min-h-[40px]",
                pathname === `/account/profiles/${profile.publicId}` &&
                  "bg-muted font-medium"
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
          ))}
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
                Add Profile
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
              Add Profile
            </Button>
          )}
        </CardContent>
      </Card>
      <PremiumRequiredDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
      />
    </>
  );
}