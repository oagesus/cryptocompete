import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sell Crypto",
  description:
    "Sell your virtual cryptocurrency holdings on CryptoCompete. Manage your portfolio and lock in profits.",
};

export default async function SellPage() {
  const t = await getTranslations("trade");

  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">
          {t("selectHolding")}
        </p>
      </CardContent>
    </Card>
  );
}