"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import { PremiumRequiredNotifyDialog } from "@/components/premium-required-notify-dialog";

interface Props {
  isAuthenticated: boolean;
  isPremium: boolean;
  variant?: "card" | "wide";
}

export function NotifyLink({ isAuthenticated, isPremium, variant = "card" }: Props) {
  const t = useTranslations("trade");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const className = variant === "wide"
    ? "flex items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50 w-full"
    : "flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50";

  if (isAuthenticated && isPremium) {
    return (
      <Link href="/trade/notify" className={className}>
        <Bell className="h-12 w-12 shrink-0" />
        <span className="text-xl font-semibold">{t("priceAlarm")}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => isAuthenticated ? setShowPremiumDialog(true) : setShowAuthDialog(true)}
        className={`${className} cursor-pointer`}
      >
        <Bell className="h-12 w-12 shrink-0" />
        <span className="text-xl font-semibold">{t("priceAlarm")}</span>
      </button>
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
      <PremiumRequiredNotifyDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </>
  );
}