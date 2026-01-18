"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2 } from "lucide-react";
import { SpendCard } from "@/components/spend-card";
import { BuyCard } from "@/components/buy-card";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  isAuthenticated: boolean;
  balance: number | null;
  supportedCurrencies: string[];
  initialPrice: number | null;
}

export function BuyPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  isAuthenticated,
  balance,
  supportedCurrencies,
  initialPrice,
}: Props) {
  const router = useRouter();
  const [spendAmount, setSpendAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [activeField, setActiveField] = useState<"spend" | "crypto">("spend");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const symbols = useMemo(() => [symbol], [symbol]);
  const { prices } = useCryptoPrices(symbols);

  const liveData = prices[symbol];
  const priceInUserCurrency = liveData 
    ? liveData.price * exchangeRate 
    : initialPrice;

  const calculatedCryptoAmount = useMemo(() => {
    if (activeField !== "spend") return null;
    const spend = parseFloat(spendAmount) || 0;
    if (!priceInUserCurrency || spend <= 0) return 0;
    return spend / priceInUserCurrency;
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
    if (amount < 0.000001) return amount.toExponential(4);
    if (amount < 1) return amount.toFixed(8);
    return amount.toFixed(6);
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
          amount: finalSpendValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to buy");
        return;
      }

      toast.success(`Successfully bought ${formatCrypto(data.cryptoAmount)} ${symbol}`);
      setSpendAmount("");
      setCryptoAmount("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        {isAuthenticated && balance !== null && (
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Balance</CardTitle>
            <span className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
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
            disabled={isLoading || finalSpendValue <= 0 || finalCryptoValue <= 0 || (balance !== null && finalSpendValue > balance)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Buy ${symbol}`
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