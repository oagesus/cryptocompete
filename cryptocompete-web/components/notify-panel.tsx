"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Loader2, Trash2, TrendingUp, TrendingDown, Pencil } from "lucide-react";
import { NotifyCard } from "@/components/notify-card";

interface PriceAlarm {
  id: number;
  symbol: string;
  name: string;
  targetPrice: number;
  currency: string;
  isAbove: boolean;
  isRecurring: boolean;
  isTriggered: boolean;
  createdAt: string;
}

interface Props {
  symbol: string;
  name: string;
  displayCurrency: string;
  exchangeRate: number;
  initialPriceUsd: number | null;
  supportedCurrencies: string[];
  alarms: PriceAlarm[];
}

export function NotifyPanel({
  symbol,
  name,
  displayCurrency,
  exchangeRate,
  initialPriceUsd,
  supportedCurrencies,
  alarms: initialAlarms,
}: Props) {
  const router = useRouter();
  const t = useTranslations("trade");
  const locale = useLocale();
  const [targetPrice, setTargetPrice] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { prices } = useCryptoPrices();

  const liveData = prices[symbol];
  const priceUsd = liveData?.price ?? initialPriceUsd;
  const priceInUserCurrency = priceUsd ? priceUsd * exchangeRate : null;

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

  function handleTargetPriceChange(value: string) {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue.length > 14) return;
    if (!/^[0-9.]*$/.test(cleanValue)) return;
    if ((cleanValue.match(/\./g) || []).length > 1) return;
    setTargetPrice(cleanValue);
  }

  function handlePercentageClick(percent: number) {
    if (!priceInUserCurrency) return;
    const adjusted = priceInUserCurrency * (1 + percent / 100);
    const decimals = adjusted >= 10 ? 2 : 6;
    setTargetPrice(adjusted.toFixed(decimals));
  }

  const displayTargetPrice = formatInputNumber(targetPrice);
  const parsedTargetPrice = parseFloat(targetPrice) || 0;

  async function handleEditAlarm(alarm: PriceAlarm) {
    const decimals = alarm.targetPrice >= 10 ? 2 : 6;
    setTargetPrice(alarm.targetPrice.toFixed(decimals));
    setIsRecurring(alarm.isRecurring);
    setEditingId(alarm.id);
    setError(null);

    if (alarm.currency !== displayCurrency) {
      try {
        await fetch("/api/currency", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currency: alarm.currency }),
        });
        router.refresh();
      } catch {}
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setTargetPrice("");
    setIsRecurring(false);
    setError(null);
  }

  async function handleSubmit() {
    if (parsedTargetPrice <= 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const url = editingId
        ? `/api/trade/price-alarm/${editingId}`
        : "/api/trade/price-alarm";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(editingId ? {} : { symbol }),
          targetPrice: parsedTargetPrice,
          isRecurring,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("somethingWentWrong"));
        return;
      }

      const formattedPrice = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: displayCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parsedTargetPrice);

      toast.success(
        editingId
          ? t("alarmUpdated", { symbol, price: formattedPrice })
          : t("alarmCreated", { symbol, price: formattedPrice })
      );
      setTargetPrice("");
      setEditingId(null);
      setIsRecurring(false);
      router.refresh();
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteAlarm(id: number) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/trade/price-alarm/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || t("somethingWentWrong"));
        return;
      }

      toast.success(t("alarmDeleted"));
      if (editingId === id) {
        setEditingId(null);
        setTargetPrice("");
        setIsRecurring(false);
        setError(null);
      }
      router.refresh();
    } catch {
      toast.error(t("somethingWentWrong"));
    } finally {
      setDeletingId(null);
    }
  }

  const formatPrice = (value: number) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatAlarmPrice = (value: number, alarmCurrency: string) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: alarmCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const symbolAlarms = initialAlarms.filter(
    (a) => a.symbol.toLowerCase() === symbol.toLowerCase()
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <NotifyCard
          value={displayTargetPrice}
          currency={displayCurrency}
          supportedCurrencies={supportedCurrencies}
          onChange={handleTargetPriceChange}
        />

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1 text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50 ${!priceInUserCurrency ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handlePercentageClick(-10)}
          >
            -10%
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1 text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50 ${!priceInUserCurrency ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handlePercentageClick(-1)}
          >
            -1%
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50 ${!priceInUserCurrency ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handlePercentageClick(1)}
          >
            +1%
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/50 ${!priceInUserCurrency ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handlePercentageClick(10)}
          >
            +10%
          </Badge>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || parsedTargetPrice <= 0}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("processing")}
            </>
          ) : (
            editingId ? t("save") : t("setAlarm")
          )}
        </Button>

        {editingId && (
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            className="w-full"
          >
            {t("cancel")}
          </Button>
        )}

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">{t("frequency")}</span>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={isRecurring ? "outline" : "default"}
              className={`cursor-pointer px-3 py-1 transition-none ${
                isRecurring ? "hover:bg-muted" : ""
              }`}
              onClick={() => setIsRecurring(false)}
            >
              {t("onceButton")}
            </Badge>
            <Badge
              variant={isRecurring ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 transition-none ${
                !isRecurring ? "hover:bg-muted" : ""
              }`}
              onClick={() => setIsRecurring(true)}
            >
              {t("recurringButton")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {parsedTargetPrice > 0 && priceInUserCurrency
              ? t(isRecurring ? "recurringDescription" : "onceDescription", {
                  symbol,
                  price: formatPrice(parsedTargetPrice),
                })
              : t(isRecurring ? "recurringDescriptionGeneric" : "onceDescriptionGeneric")
            }
          </p>
        </div>

        {symbolAlarms.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-sm font-medium">{t("activeAlarms")}</span>
            {symbolAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  editingId === alarm.id
                    ? "border-primary bg-primary/10"
                    : ""
                }`}
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-3 text-sm font-medium">
                    {alarm.isAbove ? (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    {t(alarm.isAbove ? "priceAbove" : "priceBelow", {
                      price: formatAlarmPrice(alarm.targetPrice, alarm.currency),
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground pl-[calc(0.875rem+0.75rem)]">
                    {alarm.isRecurring ? t("recurring") : t("once")}
                  </span>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditAlarm(alarm)}
                    disabled={editingId === alarm.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    disabled={deletingId === alarm.id}
                  >
                    {deletingId === alarm.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}