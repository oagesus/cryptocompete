"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProfitLossBadge } from "@/components/profit-loss-badge";
import { DelistedBadge } from "@/components/delisted-badge";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { getLocaleSeparators, formatRawAmount, getPriceDecimals } from "@/lib/format/format-number";

interface PublicHolding {
  symbol: string;
  name: string;
  amount: number;
  amountRaw?: string;
  priceUsd: number | null;
  investedValue: number;
  isDelisted: boolean;
  delistedValueInUserCurrency?: number | null;
}

interface PublicHoldingsListProps {
  holdings: PublicHolding[];
  currency: string;
  exchangeRate: number;
}

type SortKey = "name" | "value" | "price" | "total";
type SortDir = "asc" | "desc";

export function PublicHoldingsList({ holdings, currency, exchangeRate }: PublicHoldingsListProps) {
  const { prices } = useCryptoPrices();
  const t = useTranslations("leaderboard");
  const locale = useLocale();
  const { group: groupSep, decimal: decimalSep } = getLocaleSeparators(locale);

  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const enrichedHoldings = useMemo(() => {
    return holdings.map((holding) => {
      let currentValue: number | undefined;
      let profitLossPercent: number | undefined;
      let priceInCurrency: number | undefined;

      if (holding.isDelisted) {
        if (holding.delistedValueInUserCurrency != null) {
          currentValue = holding.delistedValueInUserCurrency;
        }
      } else {
        const livePrice = prices[holding.symbol];
        const priceUsd = livePrice?.price ?? holding.priceUsd;

        if (priceUsd) {
          priceInCurrency = priceUsd * exchangeRate;
          currentValue = holding.amount * priceUsd * exchangeRate;
          if (holding.investedValue > 0) {
            profitLossPercent =
              ((currentValue - holding.investedValue) / holding.investedValue) * 100;
          }
        }
      }

      const holdingValue = currentValue ?? 0;

      return {
        ...holding,
        currentValue,
        profitLossPercent,
        priceInCurrency,
        holdingValue,
      };
    });
  }, [holdings, prices, exchangeRate]);

  const sortedHoldings = useMemo(() => {
    const sorted = [...enrichedHoldings].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = b.name.localeCompare(a.name);
          break;
        case "value":
          cmp = a.holdingValue - b.holdingValue;
          break;
        case "price":
          cmp = (a.priceInCurrency ?? 0) - (b.priceInCurrency ?? 0);
          break;
        case "total":
          cmp = (a.profitLossPercent ?? -Infinity) - (b.profitLossPercent ?? -Infinity);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [enrichedHoldings, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "desc" : "desc");
    }
  };

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">{t("noHoldingsYet")}</p>
        </CardContent>
      </Card>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    );
  };

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">
              <button
                onClick={() => handleSort("name")}
                className={`flex items-center cursor-pointer ${sortKey === "name" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("holdingName")}
                <SortIcon columnKey="name" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort("value")}
                className={`flex items-center justify-end ml-auto cursor-pointer ${sortKey === "value" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("holdingValue")}
                <SortIcon columnKey="value" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort("price")}
                className={`flex items-center justify-end ml-auto cursor-pointer ${sortKey === "price" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("holdingPrice")}
                <SortIcon columnKey="price" />
              </button>
            </TableHead>
            <TableHead className="text-right pr-6">
              <button
                onClick={() => handleSort("total")}
                className={`flex items-center justify-end ml-auto cursor-pointer ${sortKey === "total" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("holdingTotal")}
                <SortIcon columnKey="total" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHoldings.map((holding) => {
            const formattedAmount = holding.amountRaw
              ? formatRawAmount(holding.amountRaw, groupSep, decimalSep, 8, true)
              : holding.amount.toLocaleString(locale, { maximumFractionDigits: 8 });

            const priceDecimals = holding.priceInCurrency
              ? getPriceDecimals(holding.priceInCurrency)
              : 2;

            const formattedValue = holding.currentValue
              ? new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(holding.currentValue)
              : null;

            const formattedPrice = holding.priceInCurrency
              ? new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency,
                  minimumFractionDigits: priceDecimals,
                  maximumFractionDigits: priceDecimals,
                }).format(holding.priceInCurrency)
              : null;

            return (
              <TableRow key={holding.symbol}>
                <TableCell className="py-4 pl-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{holding.name}</span>
                      {holding.isDelisted && <DelistedBadge />}
                    </div>
                    <span className="text-sm text-muted-foreground">{holding.symbol}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">
                      {formattedValue ?? "–"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formattedAmount} {holding.symbol}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <span className="font-medium">
                    {formattedPrice ?? "–"}
                  </span>
                </TableCell>
                <TableCell className="text-right py-4 pr-6">
                  <div className="flex justify-end">
                    {holding.profitLossPercent !== undefined ? (
                      <ProfitLossBadge percent={holding.profitLossPercent} />
                    ) : (
                      <span className="text-sm text-muted-foreground">–</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}