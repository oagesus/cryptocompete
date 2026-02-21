"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2 } from "lucide-react";
import { SpendCard } from "@/components/spend-card";
import { BuyCard } from "@/components/buy-card";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import Decimal from "decimal.js-light";
import { getLocaleSeparators, sanitizeInput, formatInputNumber, formatInputNumberRaw, formatRawAmount, isGreaterThanRaw, divideDecimalRaw, multiplyDecimalRaw } from "@/lib/format/format-number";

const CRYPTO_PRECISION = 8;

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  isAuthenticated: boolean;
  balance: number | null;
  supportedCurrencies: string[];
  initialPriceUsd: number | null;
}

export function BuyPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  isAuthenticated,
  balance,
  supportedCurrencies,
  initialPriceUsd,
}: Props) {
  const router = useRouter();
  const t = useTranslations("trade");
  const locale = useLocale();
  const [spendAmount, setSpendAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [activeField, setActiveField] = useState<"spend" | "crypto">("spend");
  const [focusedField, setFocusedField] = useState<"spend" | "crypto" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { group: groupSep, decimal: decimalSep } = useMemo(() => getLocaleSeparators(locale), [locale]);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const priceInUserCurrency = priceUsd ? priceUsd * exchangeRate : null;

  const priceInUserCurrencyStr = useMemo(() => {
    if (!priceUsd) return null;
    const result = new Decimal(priceUsd).mul(new Decimal(exchangeRate));
    return result.toFixed(18);
  }, [priceUsd, exchangeRate]);

  const calculatedCryptoRaw = useMemo(() => {
    if (activeField !== "spend" || !priceInUserCurrencyStr) return "";
    if (!spendAmount || parseFloat(spendAmount) <= 0) return "";
    return divideDecimalRaw(spendAmount, priceInUserCurrencyStr, CRYPTO_PRECISION);
  }, [activeField, spendAmount, priceInUserCurrencyStr]);

  const calculatedSpendRaw = useMemo(() => {
    if (activeField !== "crypto" || !priceInUserCurrencyStr) return "";
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) return "";
    return multiplyDecimalRaw(cryptoAmount, priceInUserCurrencyStr, 2);
  }, [activeField, cryptoAmount, priceInUserCurrencyStr]);

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: CRYPTO_PRECISION,
    }).format(amount);
  }

  const displayCryptoAmount = activeField === "spend" 
    ? calculatedCryptoRaw ? formatRawAmount(calculatedCryptoRaw, groupSep, decimalSep, CRYPTO_PRECISION, true) : ""
    : focusedField === "crypto"
      ? formatInputNumberRaw(cryptoAmount, decimalSep)
      : formatInputNumber(cryptoAmount, groupSep, decimalSep);

  const displaySpendAmount = activeField === "crypto"
    ? calculatedSpendRaw ? formatInputNumber(calculatedSpendRaw, groupSep, decimalSep) : ""
    : focusedField === "spend"
      ? formatInputNumberRaw(spendAmount, decimalSep)
      : formatInputNumber(spendAmount, groupSep, decimalSep);

  const finalSpendRaw = activeField === "spend" ? spendAmount : calculatedSpendRaw;

  const isExceedsBalance = balance !== null && finalSpendRaw
    ? isGreaterThanRaw(finalSpendRaw, balance.toFixed(2))
    : false;

  function handleSpendChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep, spendAmount);
    if (cleaned === null) return;
    setSpendAmount(cleaned);
    setActiveField("spend");
  }

  function handleCryptoChange(value: string) {
    const cleaned = sanitizeInput(value, groupSep, decimalSep, cryptoAmount);
    if (cleaned === null) return;
    setCryptoAmount(cleaned);
    setActiveField("crypto");
  }

  const finalSpendRawNum = parseFloat(finalSpendRaw) || 0;
  const finalCryptoRawNum = activeField === "crypto"
    ? parseFloat(cryptoAmount) || 0
    : parseFloat(calculatedCryptoRaw) || 0;

  const isAmountTooSmall = 
    finalCryptoRawNum <= 0 || 
    Math.round(finalSpendRawNum * 100) / 100 <= 0;

  async function handleBuy() {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    if (finalSpendRawNum <= 0 || finalCryptoRawNum <= 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          symbol,
          amount: activeField === "spend" ? spendAmount : cryptoAmount,
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
      
      toast.success(t("successBought", { 
        amount: data.cryptoAmountRaw 
          ? formatRawAmount(data.cryptoAmountRaw, groupSep, decimalSep, CRYPTO_PRECISION, true)
          : formatCrypto(data.cryptoAmount), 
        symbol, 
        value: formattedValue 
      }));
      setSpendAmount("");
      setCryptoAmount("");
      router.refresh();
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        {isAuthenticated && balance !== null && (
          <CardHeader className="pb-2">
            <span className="text-lg font-semibold">
              {t("balance")} = {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: displayCurrency,
              }).format(balance)}
            </span>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <div
            onFocus={() => setFocusedField("spend")}
            onBlur={() => setFocusedField((prev) => prev === "spend" ? null : prev)}
          >
            <SpendCard
              value={displaySpendAmount}
              currency={displayCurrency}
              supportedCurrencies={supportedCurrencies}
              onChange={handleSpendChange}
              disabled={!isAuthenticated}
            />
          </div>

          <div
            onFocus={() => setFocusedField("crypto")}
            onBlur={() => setFocusedField((prev) => prev === "crypto" ? null : prev)}
          >
            <BuyCard
              value={displayCryptoAmount}
              symbol={symbol}
              onChange={handleCryptoChange}
            />
          </div>

          {priceInUserCurrency && priceInUserCurrency > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              1 {displayCurrency} ≈ {formatCrypto(1 / priceInUserCurrency)} {symbol}
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleBuy}
            disabled={isLoading || isAmountTooSmall || isExceedsBalance}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              `${t("buy")} ${symbol}`
            )}
          </Button>
        </CardContent>
      </Card>

      <AuthRequiredDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </>
  );
}