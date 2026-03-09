import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Price Alarms",
  description:
    "Set up cryptocurrency price alarms on CryptoCompete. Get notified by email when prices hit your target.",
};

export default async function NotifyPage() {
  const t = await getTranslations("trade");

  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">
          {t("selectCryptoForAlarm")}
        </p>
      </CardContent>
    </Card>
  );
}