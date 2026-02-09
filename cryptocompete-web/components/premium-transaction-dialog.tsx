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

interface PremiumTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumTransactionDialog({ open, onOpenChange }: PremiumTransactionDialogProps) {
  const t = useTranslations("account");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("premiumRequired")}</DialogTitle>
          <DialogDescription>
            {t("premiumTransactionDescription")}
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