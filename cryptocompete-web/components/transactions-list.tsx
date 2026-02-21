"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionTypeBadge } from "@/components/transaction-type-badge";
import { PremiumTransactionDialog } from "@/components/premium-transaction-dialog";
import { TransactionsResponse } from "@/lib/transactions/get-transactions";
import { cn } from "@/lib/utils";
import { getPriceDecimals, getLocaleSeparators, formatRawAmount } from "@/lib/format/format-number";

interface TransactionsListProps {
  title?: string;
  backHref?: string;
  rank?: number | null;
  transactions: TransactionsResponse | null;
  isPremium: boolean;
}

function getPageRange(currentPage: number, totalPages: number): number[] {
  const windowSize = Math.min(5, totalPages);

  let start = currentPage - Math.floor(windowSize / 2);
  start = Math.max(1, start);
  start = Math.min(start, totalPages - windowSize + 1);

  return Array.from({ length: windowSize }, (_, i) => start + i);
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export function TransactionsList({ title, backHref, rank, transactions, isPremium }: TransactionsListProps) {
  const t = useTranslations("account");
  const locale = useLocale();
  const { group: groupSep, decimal: decimalSep } = getLocaleSeparators(locale);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

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

  const formatPriceCurrency = (value: number, currency: string) => {
    const decimals = getPriceDecimals(value);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

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

  const allTransactions = transactions?.transactions ?? [];
  const totalItems = allTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const paginatedTransactions = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return allTransactions.slice(start, start + pageSize);
  }, [allTransactions, validPage, pageSize]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CardTitle className="text-2xl font-bold">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2">
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
                  <span className="hidden md:inline">{title ?? t("transactions")}</span>
                </div>
                <span className="md:hidden">{title ?? t("transactions")}</span>
              </div>
            </CardTitle>
            {isPremium && transactions && transactions.transactions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[80px] cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()} className="cursor-pointer">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
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
                  {paginatedTransactions.map((tx) => (
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
                        {tx.amountRaw
                          ? formatRawAmount(tx.amountRaw, groupSep, decimalSep, 8, true)
                          : formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPriceCurrency(tx.pricePerUnit * transactions.exchangeRate, transactions.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(tx.totalValue * transactions.exchangeRate, transactions.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex flex-col gap-1 pt-4">
                  <div className="flex items-center justify-between md:justify-center md:gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:inline-flex h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={validPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(validPage - 1)}
                      disabled={validPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageRange(validPage, totalPages).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === validPage ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(validPage + 1)}
                      disabled={validPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:inline-flex h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 pl-0 text-xs text-muted-foreground"
                      onClick={() => setCurrentPage(1)}
                      disabled={validPage === 1}
                    >
                      <ChevronsLeft className="h-3.5 w-3.5" />
                      {t("first")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 pr-0 text-xs text-muted-foreground"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validPage === totalPages}
                    >
                      {t("last")}
                      <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
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