"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UsernameCardProps {
  username: string;
  profileId: string;
}

export function UsernameCard({ username, profileId }: UsernameCardProps) {
  const t = useTranslations("account");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("username")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <span className="text-sm font-medium">{username}</span>
          <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
            <Link href={`/account/profiles/${profileId}/change-username`}>
              {t("change")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}