"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaderboardList } from "@/components/leaderboard-list";
import { LeaderboardCountdown } from "@/components/leaderboard-countdown";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface LeaderboardEntry {
  rank: number;
  profilePublicId: string;
  username: string;
  totalValue: number;
  calculatedAt: string;
}

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  initialCurrency: string;
  initialExchangeRate: number;
  initialCalculatedAt: string | null;
  initialMinutes: number;
  initialTotalCount: number;
  currentPage: number;
  currentPageSize: number;
  timezone: string;
}

function roundToNearestHour(date: Date): Date {
  const rounded = new Date(date);
  if (rounded.getMinutes() >= 59) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else if (rounded.getMinutes() === 0 && rounded.getSeconds() <= 60) {
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
}

function getPageRange(currentPage: number, totalPages: number): number[] {
  const windowSize = Math.min(5, totalPages);

  let start = currentPage - Math.floor(windowSize / 2);
  start = Math.max(1, start);
  start = Math.min(start, totalPages - windowSize + 1);

  return Array.from({ length: windowSize }, (_, i) => start + i);
}

export function LeaderboardClient({
  initialEntries,
  initialCurrency,
  initialExchangeRate,
  initialCalculatedAt,
  initialMinutes,
  initialTotalCount,
  currentPage,
  currentPageSize,
  timezone,
}: LeaderboardClientProps) {
  const t = useTranslations("leaderboard");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState(initialEntries);
  const [currency, setCurrency] = useState(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);
  const [calculatedAt, setCalculatedAt] = useState(initialCalculatedAt);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  useEffect(() => {
    setEntries(initialEntries);
    setCurrency(initialCurrency);
    setExchangeRate(initialExchangeRate);
    setCalculatedAt(initialCalculatedAt);
    setTotalCount(initialTotalCount);
  }, [initialEntries, initialCurrency, initialExchangeRate, initialCalculatedAt, initialTotalCount]);

  const refreshCurrentPage = useCallback(async () => {
    try {
      const response = await fetch(`/api/leaderboard?page=${currentPage}&pageSize=${currentPageSize}`);
      if (!response.ok) return;
      const data = await response.json();
      setEntries(data.entries);
      setCurrency(data.currency);
      setExchangeRate(data.exchangeRate);
      setTotalCount(data.totalCount);
      if (data.entries.length > 0 && data.entries[0].calculatedAt) {
        setCalculatedAt(data.entries[0].calculatedAt);
      }
    } catch {
    }
  }, [currentPage, currentPageSize]);

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 5, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();

    let interval: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      refreshCurrentPage();
      interval = setInterval(refreshCurrentPage, 60 * 60 * 1000);
    }, msUntilNextHour);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [refreshCurrentPage]);

  const buildUrl = (page: number, pageSize: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (pageSize !== 10) params.set("pageSize", pageSize.toString());
    const queryString = params.toString();
    return `${pathname}${queryString ? `?${queryString}` : ""}`;
  };

  const handlePageChange = (page: number) => {
    router.push(buildUrl(page, currentPageSize));
  };

  const handlePageSizeChange = (value: string) => {
    router.push(buildUrl(1, Number(value)));
  };

  const totalPages = Math.ceil(totalCount / currentPageSize);
  const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const pageRange = getPageRange(validPage, totalPages);

  const leaderboardParams = (() => {
    const params = new URLSearchParams();
    if (validPage > 1) params.set("page", validPage.toString());
    if (currentPageSize !== 10) params.set("pageSize", currentPageSize.toString());
    return params.toString();
  })();

  const lastUpdated = calculatedAt
    ? roundToNearestHour(new Date(calculatedAt)).toLocaleString(locale, {
        timeZone: timezone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <div className="flex flex-col text-sm text-muted-foreground md:text-right">
              <span>
                {lastUpdated
                  ? t("updated", { date: lastUpdated })
                  : t("notYetUpdated")}
              </span>
              <LeaderboardCountdown initialMinutes={initialMinutes} />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="text-2xl font-bold">{t("rankedByPortfolioValue")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
              <Select value={currentPageSize.toString()} onValueChange={handlePageSizeChange}>
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
          </div>
          <LeaderboardList
            entries={entries}
            currency={currency}
            exchangeRate={exchangeRate}
            hideSubtitle
            leaderboardParams={leaderboardParams}
          />
          {totalPages > 1 && (
            <div className="flex flex-col gap-1 pt-6">
              <div className="flex items-center justify-between md:justify-center md:gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex h-8 w-8"
                  onClick={() => handlePageChange(1)}
                  disabled={validPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageRange.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === validPage ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex h-8 w-8"
                  onClick={() => handlePageChange(totalPages)}
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
                  onClick={() => handlePageChange(1)}
                  disabled={validPage === 1}
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                  {t("first")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 pr-0 text-xs text-muted-foreground"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={validPage === totalPages}
                >
                  {t("last")}
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}