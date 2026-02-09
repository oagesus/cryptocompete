"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionTypeBadge } from "@/components/transaction-type-badge";
import { PremiumTransactionDialog } from "@/components/premium-transaction-dialog";
import { TransactionsResponse } from "@/lib/transactions/get-transactions";
import { cn } from "@/lib/utils";

interface TransactionsListProps {
  title?: string;
  backHref?: string;
  rank?: number | null;
  transactions: TransactionsResponse | null;
  isPremium: boolean;
}

export function TransactionsList({ title, backHref, rank, transactions, isPremium }: TransactionsListProps) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setShowPremiumDialog(true);
    }
  }, [isPremium]);

  const rankBgStyles: Record<number, string> = {
    1: "bg-yellow-500/20",
    2: "bg-gray-400/20",
    3: "bg-amber-600/20",
  };

  const rankTextStyles: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  const isTopThree = rank && rank <= 3;

  const getRankSize = (r: number) => {
    if (r < 100) return "w-8 text-md";
    if (r < 1000) return "w-9 text-sm";
    return "w-auto min-w-9 px-2 text-sm";
  };

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatAmount = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {backHref && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="shrink-0 h-8 w-8"
              >
                <Link href={backHref}>
                  <ArrowLeft className="!h-8 !w-8" />
                </Link>
              </Button>
            )}
            {rank && (
              <div
                className={cn(
                  "flex h-8 items-center justify-center rounded-full font-bold shrink-0",
                  getRankSize(rank),
                  isTopThree
                    ? `${rankBgStyles[rank]} ${rankTextStyles[rank]}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {rank}
              </div>
            )}
            {title ?? t("transactions")}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          {!isPremium && (
            <p className="text-sm text-muted-foreground">{t("transactionsPremiumOnly")}</p>
          )}
          {isPremium && transactions && transactions.transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noTransactions")}</p>
          )}
          {isPremium && transactions && transactions.transactions.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t("transactionDate")}</TableHead>
                    <TableHead className="font-semibold">{t("transactionType")}</TableHead>
                    <TableHead className="font-semibold">{t("transactionAsset")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("transactionAmount")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("transactionPricePerUnit")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("transactionTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-0">
                      <TableCell className="whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge
                          type={tx.type}
                          label={t(tx.type === "Buy" ? "transactionBuy" : "transactionSell")}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{tx.symbol}</span>
                        <span className="ml-1 text-muted-foreground text-xs">
                          {tx.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(tx.pricePerUnit * transactions.exchangeRate, transactions.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(tx.totalValue * transactions.exchangeRate, transactions.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <PremiumTransactionDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </>
  );
}