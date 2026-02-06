"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, CircleArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentMethodCardBilling } from "@/components/payment-method-card-billing";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import { ResubscribeDialog } from "@/components/resubscribe-dialog";

interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  cancelledButActive: boolean;
  canResubscribe: boolean;
  activeUntil: string | null;
  planAmount: number | null;
  planCurrency: string | null;
}

interface Invoice {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
}

interface BillingClientProps {
  premium: boolean;
  subStatus: SubscriptionStatus | null;
  formattedPrice: string | null;
  formattedPeriodEnd: string | null;
  invoices: Invoice[];
  locale: string;
}

export function BillingClient({ premium, subStatus: initialSubStatus, formattedPrice, formattedPeriodEnd, invoices, locale }: BillingClientProps) {
  const t = useTranslations("billing");
  const [subStatus, setSubStatus] = useState(initialSubStatus);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResubscribeDialog, setShowResubscribeDialog] = useState(false);

  const planName = premium ? t("proPlan") : t("freePlan");

  const isCancelled = subStatus?.cancelledButActive ?? false;
  const canResubscribe = subStatus?.canResubscribe ?? false;

  const dialogTranslations: Record<string, string> = {
    cancelConfirmTitle: t("cancelConfirmTitle"),
    cancelConfirmLine1: t("cancelConfirmLine1"),
    cancelConfirmLine2: t("cancelConfirmLine2", { date: formattedPeriodEnd ?? "" }),
    cancelConfirmButton: t("cancelConfirmButton"),
    cancelKeepButton: t("cancelKeepButton"),
    cancelling: t("cancelling"),
    cancelSuccess: t("cancelSuccess"),
    cancelError: t("cancelError"),
    resubscribeConfirmTitle: t("resubscribeConfirmTitle"),
    resubscribeConfirmDescription: t("resubscribeConfirmDescription", { date: formattedPeriodEnd ?? "" }),
    resubscribeConfirmButton: t("resubscribeConfirmButton"),
    resubscribeCancelButton: t("resubscribeCancelButton"),
    resubscribing: t("resubscribing"),
    resubscribeSuccess: t("resubscribeSuccess"),
    resubscribeError: t("resubscribeError"),
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("plan")}</h3>
            <Card>
              <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <CircleArrowUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{planName}</span>
                  {premium && formattedPrice && (
                    <span className="text-sm text-muted-foreground">
                      ({formattedPrice} / {t("month")})
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
                  <Link href="/upgrade">{t("adjustPlan")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {premium && formattedPeriodEnd && (
            <Card className="bg-muted !gap-0 !py-0">
              <CardContent className="flex flex-col gap-3 !px-4 !py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isCancelled
                      ? t("cancelledOnDate", { date: formattedPeriodEnd })
                      : t("nextPaymentOnDate", { date: formattedPeriodEnd })}
                  </span>
                </div>
                {isCancelled && canResubscribe ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto !bg-muted hover:!bg-accent dark:hover:!bg-input/50"
                    onClick={() => setShowResubscribeDialog(true)}
                  >
                    {t("resubscribe")}
                  </Button>
                ) : !isCancelled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto !bg-muted hover:!bg-accent dark:hover:!bg-input/50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    {t("cancel")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("paymentMethod")}</h3>
            <PaymentMethodCardBilling />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("invoices")}</h3>
            {invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t("invoiceDate")}</TableHead>
                    <TableHead className="font-semibold">{t("invoiceTotal")}</TableHead>
                    <TableHead className="font-semibold">{t("invoiceStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-0">
                      <TableCell>
                        {new Date(invoice.paidAt).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: invoice.currency,
                        }).format(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        {t(`paymentStatus.${invoice.status.toLowerCase()}`)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noInvoices")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("disclaimer")}
      </p>

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onCancelled={() => {
          setSubStatus((prev) =>
            prev ? { ...prev, cancelledButActive: true, canResubscribe: true } : prev
          );
        }}
        translations={dialogTranslations}
      />

      <ResubscribeDialog
        open={showResubscribeDialog}
        onOpenChange={setShowResubscribeDialog}
        onResubscribed={() => {
          setSubStatus((prev) =>
            prev ? { ...prev, cancelledButActive: false, canResubscribe: false, cancelledAt: null } : prev
          );
        }}
        translations={dialogTranslations}
      />
    </>
  );
}