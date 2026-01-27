import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

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