import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

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