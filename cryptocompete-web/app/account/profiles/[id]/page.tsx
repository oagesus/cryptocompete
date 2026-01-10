"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAccount } from "@/components/account-provider";
import { UsernameCard } from "@/components/username-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ActiveBadge } from "@/components/active-badge";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params.id as string;
  const { user, refetch } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const profile = user.profiles.find((p) => p.publicId === publicId);
  const isActive = profile?.publicId === user.activeProfileId;

  async function handleSwitchProfile() {
    if (!profile || isActive) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/profiles/${profile.publicId}/activate`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to switch profile");
      }

      await refetch();
      router.refresh();
      toast.success("Profile switched successfully");
    } catch {
      toast.error("Failed to switch profile");
    } finally {
      setIsLoading(false);
    }
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Profile</CardTitle>
          {isActive ? (
            <ActiveBadge />
          ) : (
            <Button onClick={handleSwitchProfile} disabled={isLoading} size="sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Switch to this profile
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-3">
        <h3 className="text-lg font-semibold">Details</h3>
        <UsernameCard username={profile.username} />
      </CardContent>
    </Card>
  );
}