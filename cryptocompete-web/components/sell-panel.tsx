"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2 } from "lucide-react";
import { SellCard } from "@/components/sell-card";
import { ReceiveCard } from "@/components/receive-card";

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
  const [sellAmount, setSellAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeField, setActiveField] = useState<"sell" | "receive">("sell");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return amount.toFixed(CRYPTO_PRECISION);
  }

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

  const displaySellAmount = activeField === "receive"
    ? (calculatedSellAmount ?? 0) > 0 ? formatCrypto(calculatedSellAmount ?? 0) : ""
    : formatInputNumber(sellAmount);

  const displayReceiveAmount = activeField === "sell"
    ? (calculatedReceiveAmount ?? 0) > 0 ? formatInputNumber((calculatedReceiveAmount ?? 0).toFixed(2)) : ""
    : formatInputNumber(receiveAmount);

  const finalSellValue = activeField === "sell"
    ? parseFloat(parseInputNumber(sellAmount)) || 0
    : calculatedSellAmount ?? 0;

  const finalReceiveValue = activeField === "receive"
    ? parseFloat(parseInputNumber(receiveAmount)) || 0
    : calculatedReceiveAmount ?? 0;

  function handleSellAmountChange(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue.length > 14) return;
    if (!/^[0-9.]*$/.test(cleanValue)) return;
    if ((cleanValue.match(/\./g) || []).length > 1) return;
    setSellAmount(cleanValue);
    setActiveField("sell");
  }

  function handleReceiveAmountChange(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue.length > 14) return;
    if (!/^[0-9.]*$/.test(cleanValue)) return;
    if ((cleanValue.match(/\./g) || []).length > 1) return;
    setReceiveAmount(cleanValue);
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
      setError(`Insufficient ${symbol} balance`);
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
        setError(data.message || "Failed to sell");
        return;
      }

      toast.success(`Successfully sold ${formatCrypto(data.cryptoAmount)} ${symbol} for ${new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency }).format(data.value)}`);
      setSellAmount("");
      setReceiveAmount("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="text-lg font-semibold">
          Holdings = {formatCrypto(holdingAmount)} {symbol}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <SellCard
          value={displaySellAmount}
          symbol={symbol}
          onChange={handleSellAmountChange}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePercentageClick(25)}
          >
            25%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePercentageClick(50)}
          >
            50%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePercentageClick(75)}
          >
            75%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePercentageClick(100)}
          >
            100%
          </Button>
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
              Processing...
            </>
          ) : (
            `Sell ${symbol}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}