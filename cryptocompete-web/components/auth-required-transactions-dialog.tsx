"use client";

import { useRouter } from "next/navigation";
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

interface AuthRequiredTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredTransactionsDialog({ open, onOpenChange }: AuthRequiredTransactionsDialogProps) {
  const router = useRouter();
  const t = useTranslations("auth.authRequiredTransactions");

  function handleSignUp() {
    onOpenChange(false);
    router.push("/auth/register");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("goBack")}
          </Button>
          <Button onClick={handleSignUp}>
            {t("signUp")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}