"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAccount } from "@/components/account-provider";
import { isPremium } from "@/lib/auth/user-utils";
import { UsernameCard } from "@/components/username-card";
import { ProfileIdCard } from "@/components/profile-id-card";
import { PremiumSwitchDialog } from "@/components/premium-switch-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params.id as string;
  const { user, refetch } = useAccount();
  const t = useTranslations("account");
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const profile = user.profiles.find((p) => p.publicId === publicId);
  const isActive = profile?.publicId === user.activeProfileId;
  const userIsPremium = isPremium(user);

  async function handleSwitchProfile() {
    if (!profile || isActive) return;

    if (!profile.isMain && !userIsPremium) {
      setShowPremiumDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/profiles/${profile.publicId}/activate`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.status === 403) {
        setShowPremiumDialog(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to switch profile");
      }

      await refetch();
      router.refresh();
      toast.success(t("profileSwitched"));
    } catch {
      toast.error(t("failedToSwitchProfile"));
    } finally {
      setIsLoading(false);
    }
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t("profile")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{t("profileNotFound")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold">{t("profile")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-lg font-semibold">{t("details")}</h3>
          <UsernameCard username={profile.username} profileId={profile.publicId} />
          <ProfileIdCard publicId={profile.publicId} />
          <Button
            onClick={handleSwitchProfile}
            disabled={isActive || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isActive ? t("activeProfile") : t("switchToThisProfile")}
          </Button>
        </CardContent>
      </Card>
      <PremiumSwitchDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </>
  );
}