"use client";

import { useParams } from "next/navigation";
import { User } from "lucide-react";

import { useAccount } from "@/components/account-provider";
import { UsernameCard } from "@/components/username-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const params = useParams();
  const publicId = params.id as string;
  const { user } = useAccount();

  const profile = user.profiles.find((p) => p.publicId === publicId);

  if (!profile) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Profiles</CardTitle>
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
        <CardTitle className="text-2xl font-bold">Profiles</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" />
            Details
          </h3>
          <UsernameCard username={profile.username} />
        </div>
      </CardContent>
    </Card>
  );
}