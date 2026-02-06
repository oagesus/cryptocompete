"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumSwitchDialog({ open, onOpenChange }: PremiumSwitchDialogProps) {
  const t = useTranslations("account");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("premiumRequired")}</DialogTitle>
          <DialogDescription>
            {t("premiumSwitchDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("goBack")}
          </Button>
          <Button asChild>
            <Link href="/upgrade">{t("upgradePlan")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}