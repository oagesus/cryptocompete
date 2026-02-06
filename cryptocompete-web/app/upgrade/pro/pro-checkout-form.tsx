"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodCard } from "@/components/payment-method-card";

interface ProCheckoutFormProps {
  translations: Record<string, string>;
  formattedAmount: string;
  freeFormatted: string;
}

export function ProCheckoutForm({
  translations: t,
  formattedAmount,
  freeFormatted,
}: ProCheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create subscription");
        return;
      }

      const data = await res.json();

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 h-8 w-8 sm:absolute sm:left-0 sm:top-0"
          >
            <Link href="/upgrade">
              <ArrowLeft className="!h-8 !w-8" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t.upgradeToPro}</h1>
        </div>

      {/* Order Details */}
      <Card className="gap-0">
        <CardHeader className="gap-0 pb-0">
          <CardTitle className="text-lg font-semibold">{t.orderDetails}</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">{t.proPlan}</p>
              <span className="text-sm font-semibold text-muted-foreground">{formattedAmount}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formattedAmount} / {t.month}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t.totalDueToday}</span>
            <span className="text-sm font-semibold">{formattedAmount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Auto Renew Info */}
      <Card>
        <CardContent>
          <div className="flex gap-3">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{t.autoRenewInfo}</p>
          </div>
        </CardContent>
      </Card>

      <PaymentMethodCard label={t.paymentMethod} method={t.paypal} />

      {/* Agreement Text */}
      <p className="text-sm text-muted-foreground">{t.agreementText}</p>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Upgrade Button */}
      <Button
        className="w-full h-11 text-base"
        onClick={handleUpgrade}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.redirecting}
          </>
        ) : (
          t.upgradeButton
        )}
      </Button>
    </div>
    </div>
  );
}