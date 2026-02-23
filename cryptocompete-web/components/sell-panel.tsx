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
import Decimal from "decimal.js-light";
import { getLocaleSeparators, sanitizeInput, formatInputNumber, formatInputNumberRaw, formatRawAmount, isGreaterThanRaw, isLessThanRaw, divideDecimalRaw, multiplyDecimalRaw } from "@/lib/format/format-number";

const CRYPTO_PRECISION = 8;

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  holdingAmount: number;
  holdingAmountRaw: string;
  initialPriceUsd: number | null;
  supportedCurrencies: string[];
  minTradeAmount?: number;
  isDelisted?: boolean;
  delistedPriceInUserCurrency?: number | null;
}

export function SellPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  holdingAmount,
  holdingAmountRaw,
  initialPriceUsd,
  supportedCurrencies,
  minTradeAmount = 1,
  isDelisted = false,
  delistedPriceInUserCurrency,
}: Props) {
  const router = useRouter();
  const t = useTranslations("trade");
  const locale = useLocale();
  const [sellAmount, setSellAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeField, setActiveField] = useState<"sell" | "receive">("sell");
  const [focusedField, setFocusedField] = useState<"sell" | "receive" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { group: groupSep, decimal: decimalSep } = useMemo(() => getLocaleSeparators(locale), [locale]);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = isDelisted ? initialPriceUsd : (liveData?.price ?? initialPriceUsd);
  const priceInUserCurrency = isDelisted && delistedPriceInUserCurrency != null
    ? delistedPriceInUserCurrency
    : (priceUsd ? priceUsd * exchangeRate : null);

  const priceInUserCurrencyStr = useMemo(() => {
    if (isDelisted && delistedPriceInUserCurrency != null) {
      return new Decimal(delistedPriceInUserCurrency).toFixed(18);
    }
    if (!priceUsd) return null;
    const result = new Decimal(priceUsd).mul(new Decimal(exchangeRate));
    return result.toFixed(18);
  }, [priceUsd, exchangeRate, isDelisted, delistedPriceInUserCurrency]);

  const calculatedReceiveRaw = useMemo(() => {
    if (activeField !== "sell" || !priceInUserCurrencyStr) return "";
    if (!sellAmount || parseFloat(sellAmount) <= 0) return "";
    return multiplyDecimalRaw(sellAmount, priceInUserCurrencyStr, 2);
  }, [activeField, sellAmount, priceInUserCurrencyStr]);

  const calculatedSellRaw = useMemo(() => {
    if (activeField !== "receive" || !priceInUserCurrencyStr) return "";
    if (!receiveAmount || parseFloat(receiveAmount) <= 0) return "";
    return divideDecimalRaw(receiveAmount, priceInUserCurrencyStr, CRYPTO_PRECISION);
  }, [activeField, receiveAmount, priceInUserCurrencyStr]);

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: CRYPTO_PRECISION,
    }).format(amount);
  }

  const displaySellAmount = activeField === "receive"
    ? calculatedSellRaw ? formatRawAmount(calculatedSellRaw, groupSep, decimalSep, CRYPTO_PRECISION, true) : ""
    : focusedField === "sell"
      ? formatInputNumberRaw(sellAmount, decimalSep)
      : formatInputNumber(sellAmount, groupSep, decimalSep);

  const displayReceiveAmount = activeField === "sell"
    ? calculatedReceiveRaw ? formatInputNumber(calculatedReceiveRaw, groupSep, decimalSep) : ""
    : focusedField === "receive"
      ? formatInputNumberRaw(receiveAmount, decimalSep)
      : formatInputNumber(receiveAmount, groupSep, decimalSep);

  const finalSellValue = activeField === "sell"
    ? parseFloat(sellAmount) || 0
    : parseFloat(calculatedSellRaw) || 0;

  const finalReceiveValue = activeField === "receive"
    ? parseFloat(receiveAmount) || 0
    : parseFloat(calculatedReceiveRaw) || 0;

  function handleSellAmountChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep, sellAmount);
    if (cleaned === null) return;
    setSellAmount(cleaned);
    setActiveField("sell");
    setError(null);
  }

  function handleReceiveAmountChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep, receiveAmount);
    if (cleaned === null) return;
    setReceiveAmount(cleaned);
    setActiveField("receive");
    setError(null);
  }

  function handlePercentageClick(percentage: number) {
    if (percentage === 100) {
      setSellAmount(holdingAmountRaw);
    } else {
      const result = multiplyDecimalRaw(holdingAmountRaw, (percentage / 100).toFixed(2), CRYPTO_PRECISION);
      setSellAmount(result);
    }
    setActiveField("sell");
  }

  const isAmountTooSmall = 
    finalSellValue <= 0 || 
    finalReceiveValue <= 0;

  const finalReceiveRaw = activeField === "receive" ? receiveAmount : calculatedReceiveRaw;

  const isBelowMinimum = finalReceiveValue > 0 && isLessThanRaw(finalReceiveRaw, minTradeAmount.toFixed(2));

  const formattedMinAmount = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: displayCurrency,
    }).format(minTradeAmount);
  }, [locale, displayCurrency, minTradeAmount]);

  const isExceedsHolding = activeField === "sell"
    ? isGreaterThanRaw(sellAmount, holdingAmountRaw)
    : finalSellValue > holdingAmount;

  async function handleSell() {
    if (finalSellValue <= 0) return;

    setError(null);

    if (isExceedsHolding) {
      setError(t("insufficientBalance", { symbol }));
      return;
    }

    setIsLoading(true);

    const endpoint = isDelisted ? "/api/trade/sell-delisted" : "/api/trade/sell";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          symbol,
          amount: activeField === "sell" ? sellAmount : receiveAmount,
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
        amount: data.cryptoAmountRaw 
          ? formatRawAmount(data.cryptoAmountRaw, groupSep, decimalSep, CRYPTO_PRECISION, true)
          : formatCrypto(data.cryptoAmount), 
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
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold">
              {t("holdings")} = {formatRawAmount(holdingAmountRaw, groupSep, decimalSep, CRYPTO_PRECISION, true)} {symbol}
            </span>
            {priceInUserCurrency && priceInUserCurrency > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                1 {displayCurrency} ≈ {formatCrypto(1 / priceInUserCurrency)} {symbol}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onFocus={() => setFocusedField("sell")}
          onBlur={() => setFocusedField((prev) => prev === "sell" ? null : prev)}
        >
          <SellCard
            value={displaySellAmount}
            symbol={symbol}
            onChange={handleSellAmountChange}
          />
        </div>

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

        <div
          onFocus={() => setFocusedField("receive")}
          onBlur={() => setFocusedField((prev) => prev === "receive" ? null : prev)}
        >
          <ReceiveCard
            value={displayReceiveAmount}
            currency={displayCurrency}
            supportedCurrencies={supportedCurrencies}
            onChange={handleReceiveAmountChange}
          />
        </div>

          <p className="text-xs text-muted-foreground">
            {t("minimum")}: {formattedMinAmount}
          </p>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {!error && isBelowMinimum && (
          <p className="text-sm text-destructive text-center">
            {t("minimumTradeAmount", { amount: formattedMinAmount })}
          </p>
        )}

        <Button
          onClick={handleSell}
          disabled={isLoading || isAmountTooSmall || isBelowMinimum || isExceedsHolding}
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