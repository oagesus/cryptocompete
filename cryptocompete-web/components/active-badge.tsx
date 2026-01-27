"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function ActiveBadge() {
  const t = useTranslations("account");
  
  return <Badge>{t("active")}</Badge>;
}