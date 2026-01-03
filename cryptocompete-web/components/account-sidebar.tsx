"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Profile {
  publicId: string;
  username: string;
  isMain: boolean;
}

interface AccountSidebarProps {
  profiles: Profile[];
}

export function AccountSidebar({ profiles }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
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
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
            pathname === "/account/settings" && "bg-muted font-medium"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="py-2">
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            Profiles
          </span>
        </div>
        {profiles.map((profile) => (
          <Link
            key={profile.publicId}
            href={`/account/profiles/${profile.publicId}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
              pathname === `/account/profiles/${profile.publicId}` &&
                "bg-muted font-medium"
            )}
          >
            <User className="h-4 w-4" />
            {profile.username}
            {profile.isMain && (
              <span className="ml-auto text-xs text-muted-foreground">
                Main
              </span>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}