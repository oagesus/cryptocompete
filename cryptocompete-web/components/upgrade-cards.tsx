"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import { ResubscribeDialog } from "@/components/resubscribe-dialog";

interface UpgradeCardsProps {
  isCurrentPremium: boolean;
  cancelledButActive: boolean;
  canResubscribe: boolean;
  activeUntil: string | null;
  daysRemaining: number | null;
  freePrice: string;
  proPrice: string;
  freeFeatures: string[];
  proFeatures: string[];
  translations: Record<string, string>;
}

export function UpgradeCards({
  isCurrentPremium: isPremium,
  cancelledButActive: initialCancelledButActive,
  canResubscribe: initialCanResubscribe,
  daysRemaining: initialDaysRemaining,
  freePrice,
  proPrice,
  freeFeatures,
  proFeatures,
  translations: t,
}: UpgradeCardsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResubscribeDialog, setShowResubscribeDialog] = useState(false);
  const [cancelledButActive, setCancelledButActive] = useState(initialCancelledButActive);
  const [canResubscribe, setCanResubscribe] = useState(initialCanResubscribe);
  const [daysRemaining, setDaysRemaining] = useState(initialDaysRemaining);

  const endsInText = cancelledButActive && daysRemaining !== null
    ? t.endsInTemplate.replace("{days}", daysRemaining.toString())
    : "";

  const isCurrentFree = !isPremium;

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-center">
          {t.title}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col hover:border-foreground hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <CardContent className="px-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{t.freePlan}</h2>
                    <p className="text-base text-muted-foreground mt-0.5">
                      {t.freeSubtitle}
                    </p>
                  </div>
                  {isCurrentFree && (
                    <Badge variant="default">{t.current}</Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{freePrice}</span>
                  <span className="text-sm text-muted-foreground">
                    / {t.month}
                  </span>
                </div>

                {isCurrentFree ? (
                  <Button className="w-full h-11 text-base" disabled>
                    {t.currentPlan}
                  </Button>
                ) : cancelledButActive ? (
                  <Button className="w-full h-11 text-base" disabled>
                    {t.downgrade}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-11 text-base"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    {t.downgrade}
                  </Button>
                )}
              </div>
            </CardContent>

            <Separator />

            <CardContent className="p-6 space-y-3">
              <p className="text-base font-medium text-muted-foreground">
                {t.freeIncludes}
              </p>
              <ul className="space-y-2.5">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-primary/40 hover:border-primary hover:shadow-[0_0_20px_rgba(75,107,251,0.35)]">
            <CardContent className="px-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{t.proPlan}</h2>
                    <p className="text-base text-primary mt-0.5">
                      {t.proSubtitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isPremium && (
                      <Badge variant="default">{t.current}</Badge>
                    )}
                    {cancelledButActive && endsInText && (
                      <span className="text-xs text-muted-foreground">{endsInText}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{proPrice}</span>
                  <span className="text-sm text-muted-foreground">
                    / {t.month} {t.billedMonthly}
                  </span>
                </div>

                {isPremium ? (
                  cancelledButActive && canResubscribe ? (
                    <Button
                      className="w-full h-11 text-base"
                      onClick={() => setShowResubscribeDialog(true)}
                    >
                      {t.resubscribe}
                    </Button>
                  ) : (
                    <Button className="w-full h-11 text-base" disabled>
                      {t.currentPlan}
                    </Button>
                  )
                ) : (
                  <Button className="w-full h-11 text-base" asChild>
                    <Link href="/upgrade/pro">
                      {t.upgrade}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>

            <Separator />

            <CardContent className="p-6 space-y-3">
              <p className="text-base font-medium text-muted-foreground">
                {t.proIncludes}
              </p>
              <ul className="space-y-2.5">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t.disclaimer}
        </p>
      </div>

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onCancelled={(data) => {
          setCancelledButActive(true);
          setCanResubscribe(true);
          if (data.activeUntil) {
            const days = Math.max(0, Math.ceil((new Date(data.activeUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            setDaysRemaining(days);
          }
        }}
        translations={t}
      />

      <ResubscribeDialog
        open={showResubscribeDialog}
        onOpenChange={setShowResubscribeDialog}
        onResubscribed={() => {
          setCancelledButActive(false);
          setCanResubscribe(false);
          setDaysRemaining(null);
        }}
        translations={t}
      />
    </>
  );
}