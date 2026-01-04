"use client";

import { Mail, Link2 } from "lucide-react";

import { useAccount } from "@/components/account-provider";
import { EmailCard } from "@/components/email-card";
import { GoogleConnectionCard } from "@/components/google-connection-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const { user, refetch } = useAccount();

  const isGoogleConnected = user.connectedProviders.includes("Google");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5" />
            Details
          </h3>
          <EmailCard email={user.email} />
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Link2 className="h-5 w-5" />
            Connections
          </h3>
          <GoogleConnectionCard
            isConnected={isGoogleConnected}
            onConnectionChange={refetch}
          />
        </div>
      </CardContent>
    </Card>
  );
}