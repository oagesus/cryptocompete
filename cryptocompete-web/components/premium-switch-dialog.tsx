"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            {t("ok")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}