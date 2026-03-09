import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Buy Crypto",
  description:
    "Browse and buy cryptocurrencies with virtual money on CryptoCompete. Choose from hundreds of coins with real-time prices.",
};

export default async function TradeBuyPage() {
  const t = await getTranslations("trade");

  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">
          {t("selectCrypto")}
        </p>
      </CardContent>
    </Card>
  );
}