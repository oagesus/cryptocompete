"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  const router = useRouter();
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

      {/* Payment Method */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{t.paymentMethod}</span>
            <div className="flex items-center gap-2">
              <PayPalIcon />
              <span className="text-sm text-muted-foreground">{t.paypal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

function PayPalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.658h6.256c2.043 0 3.615.467 4.667 1.39.983.863 1.478 2.136 1.387 3.576-.186 2.98-2.401 4.667-5.57 4.667h-1.678a.773.773 0 0 0-.764.658l-.936 5.984a.641.641 0 0 1-.633.54H7.076v.46z"
        fill="#253B80"
      />
      <path
        d="M19.437 8.092c-.2 3.18-2.533 5.278-5.893 5.278h-1.498a.582.582 0 0 0-.575.495l-1.06 6.73a.39.39 0 0 0 .385.452h2.708a.582.582 0 0 0 .575-.495l.044-.23.736-4.665.047-.258a.582.582 0 0 1 .575-.495h.362c2.346 0 4.183-1.254 4.72-3.533.224-.953.108-1.748-.488-2.307a2.94 2.94 0 0 0-.638-.472z"
        fill="#179BD7"
      />
      <path
        d="M18.613 7.753a5.382 5.382 0 0 0-.662-.147 8.402 8.402 0 0 0-1.338-.098h-4.052a.58.58 0 0 0-.575.495l-.862 5.469-.025.16a.582.582 0 0 1 .575-.495h1.498c3.36 0 5.693-2.098 5.893-5.278a4.78 4.78 0 0 0-.008-.456 3.342 3.342 0 0 0-.444-.195v.545z"
        fill="#222D65"
      />
    </svg>
  );
}