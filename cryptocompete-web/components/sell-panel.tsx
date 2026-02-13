"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2 } from "lucide-react";
import { SellCard } from "@/components/sell-card";
import { ReceiveCard } from "@/components/receive-card";
import { getLocaleSeparators, sanitizeInput, formatInputNumber } from "@/lib/format/format-number";

const CRYPTO_PRECISION = 8;

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  holdingAmount: number;
  initialPriceUsd: number | null;
  supportedCurrencies: string[];
}

export function SellPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  holdingAmount,
  initialPriceUsd,
  supportedCurrencies,
}: Props) {
  const router = useRouter();
  const t = useTranslations("trade");
  const locale = useLocale();
  const [sellAmount, setSellAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeField, setActiveField] = useState<"sell" | "receive">("sell");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { group: groupSep, decimal: decimalSep } = useMemo(() => getLocaleSeparators(locale), [locale]);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const priceInUserCurrency = priceUsd ? priceUsd * exchangeRate : null;

  function roundCrypto(value: number): number {
    return Math.floor(value * Math.pow(10, CRYPTO_PRECISION)) / Math.pow(10, CRYPTO_PRECISION);
  }

  const calculatedReceiveAmount = useMemo(() => {
    if (activeField !== "sell") return null;
    const sell = parseFloat(sellAmount) || 0;
    if (!priceInUserCurrency || sell <= 0) return 0;
    return sell * priceInUserCurrency;
  }, [activeField, sellAmount, priceInUserCurrency]);

  const calculatedSellAmount = useMemo(() => {
    if (activeField !== "receive") return null;
    const receive = parseFloat(receiveAmount) || 0;
    if (!priceInUserCurrency || receive <= 0) return 0;
    return roundCrypto(receive / priceInUserCurrency);
  }, [activeField, receiveAmount, priceInUserCurrency]);

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: CRYPTO_PRECISION,
      maximumFractionDigits: CRYPTO_PRECISION,
    }).format(amount);
  }

  const displaySellAmount = activeField === "receive"
    ? (calculatedSellAmount ?? 0) > 0 ? formatCrypto(calculatedSellAmount ?? 0) : ""
    : formatInputNumber(sellAmount, groupSep, decimalSep);

  const displayReceiveAmount = activeField === "sell"
    ? (calculatedReceiveAmount ?? 0) > 0 ? formatInputNumber((calculatedReceiveAmount ?? 0).toFixed(2), groupSep, decimalSep) : ""
    : formatInputNumber(receiveAmount, groupSep, decimalSep);

  const finalSellValue = activeField === "sell"
    ? parseFloat(sellAmount) || 0
    : calculatedSellAmount ?? 0;

  const finalReceiveValue = activeField === "receive"
    ? parseFloat(receiveAmount) || 0
    : calculatedReceiveAmount ?? 0;

  function handleSellAmountChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep);
    if (cleaned === null) return;
    setSellAmount(cleaned);
    setActiveField("sell");
  }

  function handleReceiveAmountChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep);
    if (cleaned === null) return;
    setReceiveAmount(cleaned);
    setActiveField("receive");
  }

  function handlePercentageClick(percentage: number) {
    if (percentage === 100) {
      setSellAmount(holdingAmount.toFixed(CRYPTO_PRECISION));
    } else {
      const amount = roundCrypto(holdingAmount * (percentage / 100));
      setSellAmount(amount.toFixed(CRYPTO_PRECISION));
    }
    setActiveField("sell");
  }

  const isAmountTooSmall = 
    roundCrypto(finalSellValue) <= 0 || 
    Math.round(finalReceiveValue * 100) / 100 <= 0;

  async function handleSell() {
    if (finalSellValue <= 0) return;

    setError(null);

    if (finalSellValue > holdingAmount) {
      setError(t("insufficientBalance", { symbol }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/trade/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          symbol,
          amount: activeField === "sell" ? finalSellValue : finalReceiveValue,
          mode: activeField,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("somethingWentWrong"));
        return;
      }

      const formattedValue = new Intl.NumberFormat(locale, { 
        style: "currency", 
        currency: data.currency 
      }).format(data.value);

      toast.success(t("successSold", { 
        amount: formatCrypto(data.cryptoAmount), 
        symbol, 
        value: formattedValue 
      }));
      setSellAmount("");
      setReceiveAmount("");
      router.refresh();
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="text-lg font-semibold">
          {t("holdings")} = {formatCrypto(holdingAmount)} {symbol}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <SellCard
          value={displaySellAmount}
          symbol={symbol}
          onChange={handleSellAmountChange}
        />

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50"
            onClick={() => handlePercentageClick(25)}
          >
            25%
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50"
            onClick={() => handlePercentageClick(50)}
          >
            50%
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50"
            onClick={() => handlePercentageClick(75)}
          >
            75%
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50"
            onClick={() => handlePercentageClick(100)}
          >
            100%
          </Badge>
        </div>

        <ReceiveCard
          value={displayReceiveAmount}
          currency={displayCurrency}
          supportedCurrencies={supportedCurrencies}
          onChange={handleReceiveAmountChange}
        />

        {priceInUserCurrency && priceInUserCurrency > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            1 {displayCurrency} ≈ {formatCrypto(1 / priceInUserCurrency)} {symbol}
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          onClick={handleSell}
          disabled={isLoading || isAmountTooSmall || finalSellValue > holdingAmount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("processing")}
            </>
          ) : (
            `${t("sell")} ${symbol}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}