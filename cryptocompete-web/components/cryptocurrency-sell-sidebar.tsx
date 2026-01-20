"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

const PAGE_SIZE = 10;

export interface HoldingItem {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number | null;
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

  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { prices } = useCryptoPrices();

  const updateParams = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPage > 1) params.set("page", newPage.toString());
    
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const filteredHoldings = useMemo(() => {
    const validHoldings = holdings.filter((h) => h.amount > 0);
    if (!search) return validHoldings;
    
    const searchLower = search.toLowerCase();
    return validHoldings.filter(
      (h) =>
        h.symbol.toLowerCase().includes(searchLower) ||
        h.name.toLowerCase().includes(searchLower)
    );
  }, [holdings, search]);

  const totalPages = Math.ceil(filteredHoldings.length / PAGE_SIZE);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  
  const paginatedHoldings = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return filteredHoldings.slice(start, start + PAGE_SIZE);
  }, [filteredHoldings, validPage]);

  const handleSearchChange = (value: string) => {
    updateParams(value, 1);
  };

  const handlePageChange = (newPage: number) => {
    updateParams(search, newPage);
  };

  const currentSymbol = pathname.split("/").pop()?.toUpperCase();

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    if (amount < 1) return amount.toFixed(8);
    if (amount < 1000) return amount.toFixed(6);
    return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  function formatValue(holding: HoldingItem) {
    const livePrice = prices[holding.symbol];
    const priceUsd = livePrice?.price ?? holding.priceUsd;
    
    if (!priceUsd) return null;
    
    const valueInUserCurrency = holding.amount * priceUsd * exchangeRate;
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInUserCurrency);
  }

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3">
        <div className="pb-2">
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            Holdings
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-1 min-h-[440px]">
          {paginatedHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {holdings.filter((h) => h.amount > 0).length === 0 
                ? "You don't have any holdings to sell"
                : "No holdings found"
              }
            </p>
          ) : (
            paginatedHoldings.map((holding) => (
              <Link
                key={holding.symbol}
                href={`/trade/sell/${holding.symbol.toLowerCase()}${search ? `?search=${encodeURIComponent(search)}` : ""}${validPage > 1 ? `${search ? "&" : "?"}page=${validPage}` : ""}`}
                className={cn(
                  "flex flex-col rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted min-h-[56px]",
                  currentSymbol === holding.symbol && "bg-muted font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{holding.symbol}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatCrypto(holding.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs truncate">
                    {holding.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatValue(holding) ?? "..."}
                  </span>
                </div>
              </Link>
            ))
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