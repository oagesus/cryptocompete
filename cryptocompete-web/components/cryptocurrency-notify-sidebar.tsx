"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPriceDecimals } from "@/lib/format/format-number";
import { Cryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { ProfitLossBadge } from "@/components/profit-loss-badge";
import { SortButtons, SortMode } from "@/components/sort-buttons";
import { TimeframeDropdown, Timeframe } from "@/components/timeframe-dropdown";

const PAGE_SIZE = 8;

interface Props {
  cryptocurrencies: Cryptocurrency[];
  currency: string;
  exchangeRate: number;
}

export function CryptocurrencyNotifySidebar({ cryptocurrencies, currency, exchangeRate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("trade");
  const locale = useLocale();

  const searchFromUrl = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const sortParam = searchParams.get("sort") as SortMode | null;
  const sortMode: SortMode = sortParam && ["mcap-high", "mcap-low", "perf-high", "perf-low"].includes(sortParam)
    ? sortParam
    : "mcap-high";
  const timeframeParam = searchParams.get("tf") as Timeframe | null;
  const timeframe: Timeframe = timeframeParam && ["1d", "7d", "1m", "3m"].includes(timeframeParam)
    ? timeframeParam
    : "1d";

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

  const updateParams = (newSearch: string, newPage: number, newSort: SortMode, newTimeframe: Timeframe) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPage > 1) params.set("page", newPage.toString());
    if (newSort !== "mcap-high") params.set("sort", newSort);
    if (newTimeframe !== "1d") params.set("tf", newTimeframe);

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  function getChangePercent(crypto: Cryptocurrency) {
    switch (timeframe) {
      case "1d": {
        const livePrice = prices[crypto.symbol];
        return livePrice?.changePercent24h ?? crypto.changePercent24h;
      }
      case "7d":
        return crypto.percentChange7d;
      case "1m":
        return crypto.percentChange30d;
      case "3m":
        return crypto.percentChange90d;
      default:
        return crypto.changePercent24h;
    }
  }

  const filteredAndSortedCryptos = useMemo(() => {
    let filtered = cryptocurrencies;

    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      filtered = cryptocurrencies.filter(
        (c) =>
          c.symbol.toLowerCase().includes(searchLower) ||
          c.name.toLowerCase().includes(searchLower)
      );
    }

    const sorted = [...filtered];

    switch (sortMode) {
      case "mcap-high":
        sorted.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
        break;
      case "mcap-low":
        sorted.sort((a, b) => (b.rank ?? -Infinity) - (a.rank ?? -Infinity));
        break;
      case "perf-high":
        sorted.sort((a, b) => (getChangePercent(b) ?? -Infinity) - (getChangePercent(a) ?? -Infinity));
        break;
      case "perf-low":
        sorted.sort((a, b) => (getChangePercent(a) ?? Infinity) - (getChangePercent(b) ?? Infinity));
        break;
    }

    return sorted;
  }, [cryptocurrencies, searchInput, sortMode, prices, timeframe]);

  const totalPages = Math.ceil(filteredAndSortedCryptos.length / PAGE_SIZE);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);

  const paginatedCryptos = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return filteredAndSortedCryptos.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedCryptos, validPage]);

  const handlePageChange = (newPage: number) => {
    updateParams(searchInput, newPage, sortMode, timeframe);
  };

  const handleSortChange = (mode: SortMode) => {
    updateParams(searchInput, 1, mode, timeframe);
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    updateParams(searchInput, 1, sortMode, tf);
  };

  const currentSymbol = pathname.split("/").pop()?.toUpperCase();

  function formatPrice(crypto: Cryptocurrency) {
    const livePrice = prices[crypto.symbol];
    const priceUsd = livePrice?.price ?? crypto.priceUsd;

    if (!priceUsd) return "...";

    const priceInCurrency = priceUsd * exchangeRate;
    const decimals = getPriceDecimals(priceInCurrency);

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(priceInCurrency);
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (validPage > 1) params.set("page", validPage.toString());
    if (sortMode !== "mcap-high") params.set("sort", sortMode);
    if (timeframe !== "1d") params.set("tf", timeframe);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3">
        <div className="pb-2">
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            {t("cryptocurrencies")}
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

        <div className="flex flex-col gap-2">
          <div className="flex justify-end">
            <TimeframeDropdown
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>
          <SortButtons sortMode={sortMode} onSortChange={handleSortChange} />
        </div>

        <div className="space-y-1 min-h-[440px]">
          {paginatedCryptos.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {t("noCryptosFound")}
            </p>
          ) : (
            paginatedCryptos.map((crypto) => {
              const changePercent = getChangePercent(crypto);
              return (
                <Link
                  key={crypto.symbol}
                  href={`/trade/notify/${crypto.symbol.toLowerCase()}${buildQueryString()}`}
                  className={cn(
                    "flex flex-col rounded-md px-3 py-2 text-sm hover:bg-muted min-h-[56px]",
                    currentSymbol === crypto.symbol && "bg-muted font-medium"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{crypto.name}</span>
                    {changePercent !== null && changePercent !== undefined && (
                      <ProfitLossBadge percent={changePercent} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs truncate">
                      {crypto.symbol}
                    </span>
                    <span className="font-medium">
                      {formatPrice(crypto)}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(validPage - 1)}
              disabled={validPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {validPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(validPage + 1)}
              disabled={validPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}