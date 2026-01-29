"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MinusCircle } from "lucide-react";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";

interface Props {
  isAuthenticated: boolean;
}

export function SellLink({ isAuthenticated }: Props) {
  const t = useTranslations("trade");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (isAuthenticated) {
    return (
      <Link
        href="/trade/sell"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
      >
        <MinusCircle className="h-12 w-12" />
        <span className="text-xl font-semibold">{t("sell")}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuthDialog(true)}
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer"
      >
        <MinusCircle className="h-12 w-12" />
        <span className="text-xl font-semibold">{t("sell")}</span>
      </button>
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </>
  );
}