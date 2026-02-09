"use client";

import { useState } from "react";
import Link from "next/link";
import { PremiumTransactionDialog } from "@/components/premium-transaction-dialog";
import { AuthRequiredTransactionsDialog } from "@/components/auth-required-transactions-dialog";

interface ViewTransactionsLinkProps {
  href: string;
  isAuthenticated?: boolean;
  isPremium: boolean;
  label: string;
}

export function ViewTransactionsLink({ href, isAuthenticated = true, isPremium, label }: ViewTransactionsLinkProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  if (isPremium) {
    return (
      <Link
        href={href}
        className="text-sm font-medium text-primary hover:underline"
      >
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => isAuthenticated ? setShowPremiumDialog(true) : setShowAuthDialog(true)}
        className="text-sm font-medium text-primary hover:underline cursor-pointer"
      >
        {label}
      </button>
      <AuthRequiredTransactionsDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
      <PremiumTransactionDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </>
  );
}