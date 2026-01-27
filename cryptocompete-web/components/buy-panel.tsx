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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const priceInUserCurrency = priceUsd ? priceUsd * exchangeRate : null;

  function roundCrypto(value: number): number {
    return Math.floor(value * Math.pow(10, CRYPTO_PRECISION)) / Math.pow(10, CRYPTO_PRECISION);
  }

  const calculatedCryptoAmount = useMemo(() => {
    if (activeField !== "spend") return null;
    const spend = parseFloat(spendAmount) || 0;
    if (!priceInUserCurrency || spend <= 0) return 0;
    return roundCrypto(spend / priceInUserCurrency);
  }, [activeField, spendAmount, priceInUserCurrency]);

  const calculatedSpendAmount = useMemo(() => {
    if (activeField !== "crypto") return null;
    const crypto = parseFloat(cryptoAmount) || 0;
    if (!priceInUserCurrency || crypto <= 0) return 0;
    return crypto * priceInUserCurrency;
  }, [activeField, cryptoAmount, priceInUserCurrency]);

  function formatInputNumber(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (!cleanValue || cleanValue === ".") return cleanValue;
    
    const parts = cleanValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    if (parts.length === 2) {
      return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
  }

  function parseInputNumber(value: string) {
    return value.replace(/,/g, "");
  }

  const displayCryptoAmount = activeField === "spend" 
    ? (calculatedCryptoAmount ?? 0) > 0 ? formatCrypto(calculatedCryptoAmount ?? 0) : ""
    : formatInputNumber(cryptoAmount);

  const displaySpendAmount = activeField === "crypto"
    ? (calculatedSpendAmount ?? 0) > 0 ? formatInputNumber((calculatedSpendAmount ?? 0).toFixed(2)) : ""
    : formatInputNumber(spendAmount);

  const finalSpendValue = activeField === "spend" 
    ? parseFloat(parseInputNumber(spendAmount)) || 0
    : calculatedSpendAmount ?? 0;

  const finalCryptoValue = activeField === "crypto"
    ? parseFloat(parseInputNumber(cryptoAmount)) || 0
    : calculatedCryptoAmount ?? 0;

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    return amount.toFixed(CRYPTO_PRECISION);
  }

  function handleSpendChange(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue.length > 14) return;
    if (!/^[0-9.]*$/.test(cleanValue)) return;
    if ((cleanValue.match(/\./g) || []).length > 1) return;
    setSpendAmount(cleanValue);
    setActiveField("spend");
  }

  function handleCryptoChange(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue.length > 14) return;
    if (!/^[0-9.]*$/.test(cleanValue)) return;
    if ((cleanValue.match(/\./g) || []).length > 1) return;
    setCryptoAmount(cleanValue);
    setActiveField("crypto");
  }

  const isAmountTooSmall = 
    roundCrypto(finalCryptoValue) <= 0 || 
    Math.round(finalSpendValue * 100) / 100 <= 0;

  async function handleBuy() {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    if (finalSpendValue <= 0 || finalCryptoValue <= 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          symbol,
          amount: activeField === "spend" ? finalSpendValue : finalCryptoValue,
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
        amount: formatCrypto(data.cryptoAmount), 
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
          <SpendCard
            value={displaySpendAmount}
            currency={displayCurrency}
            supportedCurrencies={supportedCurrencies}
            onChange={handleSpendChange}
            disabled={!isAuthenticated}
          />

          <BuyCard
            value={displayCryptoAmount}
            symbol={symbol}
            onChange={handleCryptoChange}
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
            onClick={handleBuy}
            disabled={isLoading || isAmountTooSmall || (balance !== null && finalSpendValue > balance)}
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