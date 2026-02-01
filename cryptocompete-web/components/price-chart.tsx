"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ProfitLossBadge } from "@/components/profit-loss-badge";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { type Kline, type KlineTimeframe } from "@/lib/crypto/get-klines";

interface Props {
  symbol: string;
  name: string;
  initialKlines?: Kline[];
  initialTimeframe?: KlineTimeframe;
  initialPriceUsd: number | null;
  initialChangePercent24h?: number | null;
  displayCurrency: string;
  exchangeRate: number;
  percentChange7d?: number | null;
  percentChange30d?: number | null;
  percentChange90d?: number | null;
}

const TIMEFRAMES: { value: KlineTimeframe; label: string }[] = [
  { value: "1D", label: "1D" },
  { value: "7D", label: "7D" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
  { value: "YTD", label: "YTD" },
];

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function getNextRefreshTime(timeframe: KlineTimeframe): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();

  const bufferSeconds = 5;

  let nextRefresh: Date;

  const getYtdIntervalMinutes = (): number => {
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const daysElapsed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysElapsed <= 1) return 5;
    if (daysElapsed <= 7) return 15;
    if (daysElapsed <= 30) return 60;
    if (daysElapsed <= 90) return 240;
    return -1;
  };

  switch (timeframe) {
    case "1D": {
      const nextInterval = Math.ceil((minutes + 1) / 5) * 5;
      nextRefresh = new Date(Date.UTC(year, month, day, hours, nextInterval, bufferSeconds));
      if (nextInterval >= 60) {
        nextRefresh = new Date(Date.UTC(year, month, day, hours + 1, 0, bufferSeconds));
      }
      break;
    }
    case "7D": {
      const nextInterval = Math.ceil((minutes + 1) / 15) * 15;
      nextRefresh = new Date(Date.UTC(year, month, day, hours, nextInterval, bufferSeconds));
      if (nextInterval >= 60) {
        nextRefresh = new Date(Date.UTC(year, month, day, hours + 1, 0, bufferSeconds));
      }
      break;
    }
    case "1M": {
      nextRefresh = new Date(Date.UTC(year, month, day, hours + 1, 0, bufferSeconds));
      break;
    }
    case "3M": {
      const nextHourBlock = Math.ceil((hours + 1) / 4) * 4;
      nextRefresh = new Date(Date.UTC(year, month, day, nextHourBlock, 0, bufferSeconds));
      break;
    }
    case "1Y": {
      const isSummer = month >= 3 && month <= 9;
      const resetHour = isSummer ? 2 : 1;
      if (hours >= resetHour) {
        nextRefresh = new Date(Date.UTC(year, month, day + 1, resetHour, 0, bufferSeconds));
      } else {
        nextRefresh = new Date(Date.UTC(year, month, day, resetHour, 0, bufferSeconds));
      }
      break;
    }
    case "YTD": {
      const intervalMinutes = getYtdIntervalMinutes();
      if (intervalMinutes === -1) {
        const isSummer = month >= 3 && month <= 9;
        const resetHour = isSummer ? 2 : 1;
        if (hours >= resetHour) {
          nextRefresh = new Date(Date.UTC(year, month, day + 1, resetHour, 0, bufferSeconds));
        } else {
          nextRefresh = new Date(Date.UTC(year, month, day, resetHour, 0, bufferSeconds));
        }
      } else if (intervalMinutes === 60) {
        nextRefresh = new Date(Date.UTC(year, month, day, hours + 1, 0, bufferSeconds));
      } else if (intervalMinutes === 240) {
        const nextHourBlock = Math.ceil((hours + 1) / 4) * 4;
        nextRefresh = new Date(Date.UTC(year, month, day, nextHourBlock, 0, bufferSeconds));
      } else {
        const nextInterval = Math.ceil((minutes + 1) / intervalMinutes) * intervalMinutes;
        nextRefresh = new Date(Date.UTC(year, month, day, hours, nextInterval, bufferSeconds));
        if (nextInterval >= 60) {
          nextRefresh = new Date(Date.UTC(year, month, day, hours + 1, 0, bufferSeconds));
        }
      }
      break;
    }
    default:
      nextRefresh = new Date(now.getTime() + 5 * 60 * 1000);
  }

  return nextRefresh.getTime() - now.getTime();
}

export function PriceChart({
  symbol,
  name,
  initialKlines,
  initialTimeframe = "1D",
  initialPriceUsd,
  initialChangePercent24h,
  displayCurrency,
  exchangeRate,
  percentChange7d,
  percentChange30d,
  percentChange90d,
}: Props) {
  const t = useTranslations("trade");
  const locale = useLocale();
  const [timeframe, setTimeframe] = useState<KlineTimeframe>(initialTimeframe);
  const [klinesCache, setKlinesCache] = useState<Record<KlineTimeframe, Kline[]>>(() => {
    const initial: Record<KlineTimeframe, Kline[]> = {
      "1D": [],
      "7D": [],
      "1M": [],
      "3M": [],
      "1Y": [],
      "YTD": [],
    };
    if (initialKlines && initialKlines.length > 0) {
      initial[initialTimeframe] = initialKlines;
    }
    return initial;
  });
  const [loading, setLoading] = useState(!initialKlines);
  const [error, setError] = useState<string | null>(null);
  
  const prefetchStarted = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const livePrice = priceUsd ? priceUsd * exchangeRate : null;
  const liveChangePercent24h = liveData?.changePercent24h;

  const klines = klinesCache[timeframe];

  const refreshKlines = useCallback(async (tf: KlineTimeframe) => {
    try {
      const response = await fetch(
        `/api/cryptocurrencies/${symbol}/klines?timeframe=${tf}`
      );
      if (response.ok) {
        const data = await response.json();
        setKlinesCache(prev => ({
          ...prev,
          [tf]: data.klines,
        }));
      }
    } catch {
    }
  }, [symbol]);

  useEffect(() => {
    const scheduleNextRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const msUntilRefresh = getNextRefreshTime(timeframe);

      refreshTimerRef.current = setTimeout(() => {
        refreshKlines(timeframe);
        scheduleNextRefresh();
      }, msUntilRefresh);
    };

    scheduleNextRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [timeframe, refreshKlines]);

  useEffect(() => {
    if (prefetchStarted.current) return;
    prefetchStarted.current = true;

    const prefetchTimeframes = async () => {
      const otherTimeframes = TIMEFRAMES
        .map(tf => tf.value)
        .filter(tf => tf !== initialTimeframe);

      const results = await Promise.all(
        otherTimeframes.map(async (tf) => {
          try {
            const response = await fetch(
              `/api/cryptocurrencies/${symbol}/klines?timeframe=${tf}`
            );
            if (response.ok) {
              const data = await response.json();
              return { tf, klines: data.klines as Kline[] };
            }
          } catch {
          }
          return { tf, klines: null };
        })
      );

      setKlinesCache(prev => {
        const updated = { ...prev };
        for (const { tf, klines } of results) {
          if (klines) {
            updated[tf] = klines;
          }
        }
        return updated;
      });
    };

    prefetchTimeframes();
  }, [symbol, initialTimeframe]);

  useEffect(() => {
    if (klines.length > 0) {
      setLoading(false);
      return;
    }

    const fetchKlines = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/cryptocurrencies/${symbol}/klines?timeframe=${timeframe}`
        );
        if (response.ok) {
          const data = await response.json();
          setKlinesCache(prev => ({
            ...prev,
            [timeframe]: data.klines,
          }));
        } else {
          setError(t("unableToLoadChart"));
        }
      } catch {
        setError(t("unableToLoadChart"));
      }

      setLoading(false);
    };

    fetchKlines();
  }, [symbol, timeframe, klines.length, t]);

  const chartData = useMemo(() => {
    return klines.map((k) => ({
      time: k.openTime,
      price: k.close * exchangeRate,
    }));
  }, [klines, exchangeRate]);

  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return undefined;
    if (timeframe === "1D") return undefined;
    
    const seenDates = new Set<string>();
    const ticks: number[] = [];
    
    for (const d of chartData) {
      const date = new Date(d.time);
      let key: string;
      
      if (timeframe === "1Y") {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }
      
      if (!seenDates.has(key)) {
        seenDates.add(key);
        ticks.push(d.time);
      }
    }
    
    return ticks;
  }, [chartData, timeframe]);

  const formatYAxisPrice = (value: number) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const yAxisWidth = 90;

  const calculatedChangePercent = useMemo(() => {
    if (chartData.length < 2) {
      return 0;
    }

    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const change = lastPrice - firstPrice;
    return (change / firstPrice) * 100;
  }, [chartData]);

  const priceChangePercent = useMemo(() => {
    switch (timeframe) {
      case "1D":
        if (liveChangePercent24h !== null && liveChangePercent24h !== undefined) {
          return liveChangePercent24h;
        }
        if (initialChangePercent24h !== null && initialChangePercent24h !== undefined) {
          return initialChangePercent24h;
        }
        return calculatedChangePercent;
      case "7D":
        if (percentChange7d !== null && percentChange7d !== undefined) {
          return percentChange7d;
        }
        return calculatedChangePercent;
      case "1M":
        if (percentChange30d !== null && percentChange30d !== undefined) {
          return percentChange30d;
        }
        return calculatedChangePercent;
      case "3M":
        if (percentChange90d !== null && percentChange90d !== undefined) {
          return percentChange90d;
        }
        return calculatedChangePercent;
      case "1Y":
      case "YTD":
      default:
        return calculatedChangePercent;
    }
  }, [timeframe, liveChangePercent24h, initialChangePercent24h, percentChange7d, percentChange30d, percentChange90d, calculatedChangePercent]);

  const isPositive = priceChangePercent >= 0;

  const getTimeframeLabel = (tf: KlineTimeframe) => {
    switch (tf) {
      case "1D": return t("today");
      case "7D": return t("past7Days");
      case "1M": return t("pastMonth");
      case "3M": return t("past3Months");
      case "1Y": return t("pastYear");
      case "YTD": return t("yearToDate");
      default: return "";
    }
  };

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (timeframe) {
      case "1D":
        return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      case "7D":
      case "1M":
      case "3M":
      case "YTD":
        return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
      case "1Y":
        return date.toLocaleDateString(locale, { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString(locale);
    }
  };

  const formatPrice = (value: number) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatTooltipDate = (timestamp: number) => {
    const date = new Date(timestamp);

    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const showSkeleton = loading && chartData.length === 0;

  const livePriceDecimals = livePrice && livePrice >= 10 ? 2 : 6;
  const formattedLivePrice = livePrice
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: displayCurrency,
        minimumFractionDigits: livePriceDecimals,
        maximumFractionDigits: livePriceDecimals,
      }).format(livePrice)
    : null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {formattedLivePrice && (
              <span className="text-2xl font-semibold tracking-tight">
                1 {symbol} = {formattedLivePrice}
              </span>
            )}
            {chartData.length > 0 && (
              <div className="flex items-center gap-2">
                <ProfitLossBadge percent={priceChangePercent} />
                <span className="text-sm text-muted-foreground">
                  {getTimeframeLabel(timeframe)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`text-xs px-2 py-1 cursor-pointer ${
                  timeframe === tf.value
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showSkeleton ? (
          <div className="h-[300px] w-full" />
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            {t("noDataAvailable")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                ticks={xAxisTicks}
                minTickGap={50}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatYAxisPrice}
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
                width={yAxisWidth}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return formatTooltipDate(payload[0].payload.time);
                      }
                      return "";
                    }}
                    formatter={(value) => [formatPrice(value as number), ""]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                strokeWidth={2}
                fill={`url(#gradient-${symbol})`}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}