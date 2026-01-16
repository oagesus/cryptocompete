"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Cryptocurrency } from "@/lib/crypto/get-cryptocurrencies";

const PAGE_SIZE = 10;

interface Props {
  cryptocurrencies: Cryptocurrency[];
}

export function CryptocurrencySidebar({ cryptocurrencies }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const updateParams = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPage > 1) params.set("page", newPage.toString());
    
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const filteredCryptos = useMemo(() => {
    if (!search) return cryptocurrencies;
    
    const searchLower = search.toLowerCase();
    return cryptocurrencies.filter(
      (c) =>
        c.symbol.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower)
    );
  }, [cryptocurrencies, search]);

  const totalPages = Math.ceil(filteredCryptos.length / PAGE_SIZE);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  
  const paginatedCryptos = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return filteredCryptos.slice(start, start + PAGE_SIZE);
  }, [filteredCryptos, validPage]);

  const handleSearchChange = (value: string) => {
    updateParams(value, 1);
  };

  const handlePageChange = (newPage: number) => {
    updateParams(search, newPage);
  };

  const currentSymbol = pathname.split("/").pop()?.toUpperCase();

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3">
        <div className="pb-2">
          <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            Cryptocurrencies
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
          {paginatedCryptos.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              No cryptocurrencies found
            </p>
          ) : (
            paginatedCryptos.map((crypto) => (
              <Link
                key={crypto.symbol}
                href={`/trade/${crypto.symbol.toLowerCase()}${search ? `?search=${encodeURIComponent(search)}` : ""}${validPage > 1 ? `${search ? "&" : "?"}page=${validPage}` : ""}`}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted min-h-[40px]",
                  currentSymbol === crypto.symbol && "bg-muted font-medium"
                )}
              >
                <span className="font-medium">{crypto.symbol}</span>
                <span className="text-muted-foreground truncate ml-2">
                  {crypto.name}
                </span>
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