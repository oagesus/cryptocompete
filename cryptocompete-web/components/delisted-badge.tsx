"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function DelistedBadge() {
  const t = useTranslations("trade");
  
  return (
    <Badge variant="destructive">
      {t("delisted")}
    </Badge>
  );
}