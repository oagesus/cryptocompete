"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2 } from "lucide-react";
import { SellCard } from "@/components/sell-card";
import { ReceiveCard } from "@/components/receive-card";

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  holdingAmount: number;
  initialPrice: number | null;
  supportedCurrencies: string[];
}

export function SellPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  holdingAmount,
  initialPrice,
  supportedCurrencies,
}: Props) {
  const router = useRouter();
  const [sellAmount, setSellAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeField, setActiveField] = useState<"sell" | "receive">("sell");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbols = useMemo(() => [symbol], [symbol]);
  const { prices } = useCryptoPrices(symbols);

  const liveData = prices[symbol];
  const priceInUserCurrency = liveData 
    ? liveData.price * exchangeRate 
    : initialPrice;

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
    return receive / priceInUserCurrency;
  }, [activeField, receiveAmount, priceInUserCurrency]);

  function formatCrypto(amount: number) {
    if (amount === 0) return "0";
    if (amount < 0.000001) return amount.toExponential(4);
    if (amount < 1) return amount.toFixed(8);
    return amount.toFixed(6);
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
    const amount = holdingAmount * (percentage / 100);
    setSellAmount(amount.toString());
    setActiveField("sell");
  }

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
          cryptoAmount: finalSellValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to sell");
        return;
      }

      toast.success(`Successfully sold ${formatCrypto(data.cryptoAmount)} ${symbol}`);
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
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Holdings</CardTitle>
        <span className="text-2xl font-bold">
          {formatCrypto(holdingAmount)} {symbol}
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
          disabled={isLoading || finalSellValue <= 0 || finalSellValue > holdingAmount}
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