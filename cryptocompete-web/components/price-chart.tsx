"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ProfitLossBadge } from "@/components/profit-loss-badge";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { type KlineTimeframe, type AllKlinesData } from "@/lib/crypto/get-klines";

interface Props {
  symbol: string;
  name: string;
  allKlines: AllKlinesData;
  initialPriceUsd: number | null;
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

export function PriceChart({
  symbol,
  name,
  allKlines,
  initialPriceUsd,
  displayCurrency,
  exchangeRate,
  percentChange7d,
  percentChange30d,
  percentChange90d,
}: Props) {
  const [timeframe, setTimeframe] = useState<KlineTimeframe>("1D");

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const livePrice = priceUsd ? priceUsd * exchangeRate : null;
  const liveChangePercent24h = liveData?.changePercent24h;

  const klines = allKlines[timeframe];

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

  const yAxisWidth = 90;

  const formatYAxisPrice = (value: number) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

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
        return liveChangePercent24h ?? calculatedChangePercent;
      case "7D":
        return percentChange7d ?? calculatedChangePercent;
      case "1M":
        return percentChange30d ?? calculatedChangePercent;
      case "3M":
        return percentChange90d ?? calculatedChangePercent;
      case "1Y":
      case "YTD":
      default:
        return calculatedChangePercent;
    }
  }, [timeframe, liveChangePercent24h, percentChange7d, percentChange30d, percentChange90d, calculatedChangePercent]);

  const isPositive = priceChangePercent >= 0;

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (timeframe) {
      case "1D":
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      case "7D":
      case "1M":
      case "3M":
      case "YTD":
        return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      case "1Y":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString("en-US");
    }
  };

  const formatPrice = (value: number) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatTooltipDate = (timestamp: number) => {
    const date = new Date(timestamp);

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const livePriceDecimals = livePrice && livePrice >= 10 ? 2 : 6;
  const formattedLivePrice = livePrice
    ? new Intl.NumberFormat("en-US", {
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
                  {timeframe === "1D" ? "Today" : timeframe === "7D" ? "Past 7 days" : timeframe === "1M" ? "Past month" : timeframe === "3M" ? "Past 3 months" : timeframe === "1Y" ? "Past year" : "Year to date"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`text-xs px-2 py-1 cursor-pointer transition-colors ${
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
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
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