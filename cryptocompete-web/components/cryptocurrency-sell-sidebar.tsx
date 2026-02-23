"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarPagination } from "@/components/sidebar-pagination";
import { DelistedBadge } from "@/components/delisted-badge";
import { cn } from "@/lib/utils";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

const PAGE_SIZE = 8;

export interface HoldingItem {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number | null;
  isDelisted: boolean;
  delistedValueInUserCurrency?: number | null;
}

interface Props {
  holdings: HoldingItem[];
  currency: string;
  exchangeRate: number;
}

export function CryptocurrencySellSidebar({ holdings, currency, exchangeRate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("trade");
  const locale = useLocale();

  const searchFromUrl = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  const updateUrlSilently = (newSearch: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search");
    }
    params.delete("page");
    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateUrlSilently(value);
  };

  const { prices } = useCryptoPrices();

  const updateParams = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPage > 1) params.set("page", newPage.toString());
    
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  function getSortValue(holding: HoldingItem) {
    if (holding.isDelisted) {
      return holding.delistedValueInUserCurrency ?? 0;
    }
    const livePrice = prices[holding.symbol];
    const priceUsd = livePrice?.price ?? holding.priceUsd;
    if (!priceUsd) return 0;
    return holding.amount * priceUsd;
  }

  const filteredAndSortedHoldings = useMemo(() => {
    let filtered = holdings.filter((h) => h.amount > 0);
    
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.symbol.toLowerCase().includes(searchLower) ||
          h.name.toLowerCase().includes(searchLower)
      );
    }

    return [...filtered].sort((a, b) => getSortValue(b) - getSortValue(a));
  }, [holdings, searchInput, prices]);

  const totalPages = Math.ceil(filteredAndSortedHoldings.length / PAGE_SIZE);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  
  const paginatedHoldings = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return filteredAndSortedHoldings.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedHoldings, validPage]);

  const handlePageChange = (newPage: number) => {
    updateParams(searchInput, newPage);
  };

  const currentSymbol = pathname.split("/").pop()?.toUpperCase();

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    if (amount < 1) {
      return new Intl.NumberFormat(locale, { minimumFractionDigits: 8, maximumFractionDigits: 8 }).format(amount);
    }
    if (amount < 1000) {
      return new Intl.NumberFormat(locale, { minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(amount);
    }
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
  }

  function formatValue(holding: HoldingItem) {
    if (holding.isDelisted) {
      if (holding.delistedValueInUserCurrency == null) return null;
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(holding.delistedValueInUserCurrency);
    }

    const livePrice = prices[holding.symbol];
    const priceUsd = livePrice?.price ?? holding.priceUsd;
    
    if (!priceUsd) return null;
    
    const valueInUserCurrency = holding.amount * priceUsd * exchangeRate;
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInUserCurrency);
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (validPage > 1) params.set("page", validPage.toString());
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3">
        <div className="pb-2">
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            {t("holdings")}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-1 h-[480px]">
          {paginatedHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {holdings.filter((h) => h.amount > 0).length === 0 
                ? t("noHoldings")
                : t("noHoldingsFound")
              }
            </p>
          ) : (
            paginatedHoldings.map((holding) => (
              <Link
                key={holding.symbol}
                href={`/trade/sell/${holding.symbol.toLowerCase()}${buildQueryString()}`}
                className={cn(
                  "flex flex-col rounded-md px-3 py-2 text-sm hover:bg-muted min-h-[56px]",
                  currentSymbol === holding.symbol && "bg-muted font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{holding.name}</span>
                    {holding.isDelisted && <DelistedBadge />}
                  </div>
                  <span className="font-medium shrink-0 ml-2">
                    {formatValue(holding) ?? "..."}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs truncate">
                    {holding.symbol}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatCrypto(holding.amount)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <SidebarPagination
          currentPage={validPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  );
}