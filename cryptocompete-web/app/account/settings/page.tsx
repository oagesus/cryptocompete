"use client";

import { useAccount } from "@/components/account-provider";
import { EmailCard } from "@/components/email-card";
import { PasswordCard } from "@/components/password-card";
import { GoogleConnectionCard } from "@/components/google-connection-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const { user, refetch } = useAccount();

  const googleConnection = user.connectedProviders.find(p => p.provider === "Google");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Details</h3>
          <EmailCard email={user.email} />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Security</h3>
          <PasswordCard hasPassword={user.hasPassword} />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Connections</h3>
          <GoogleConnectionCard
            googleConnection={googleConnection}
            hasPassword={user.hasPassword}
            onConnectionChange={refetch}
          />
        </div>
      </CardContent>
    </Card>
  );
}