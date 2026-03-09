"use client";

import { useTranslations } from "next-intl";
import { useAccount } from "@/components/account-provider";
import { EmailCard } from "@/components/email-card";
import { AccountIdCard } from "@/components/account-id-card";
import { PasswordCard } from "@/components/password-card";
import { GoogleConnectionCard } from "@/components/google-connection-card";
import { ThemeCard } from "@/components/theme-card";
import { LanguageCard } from "@/components/language-card";
import { CurrencyCard } from "@/components/currency-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const { user, refetch } = useAccount();
  const t = useTranslations("account");

  const googleConnection = user.connectedProviders.find(p => p.provider === "Google");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t("details")}</h3>
          <EmailCard email={user.email} />
          <AccountIdCard />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t("security")}</h3>
          <PasswordCard hasPassword={user.hasPassword} />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t("connections")}</h3>
          <GoogleConnectionCard
            googleConnection={googleConnection}
            hasPassword={user.hasPassword}
            onConnectionChange={refetch}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t("display")}</h3>
          <ThemeCard />
          <CurrencyCard />
          <LanguageCard />
        </div>
      </CardContent>
    </Card>
  );
}