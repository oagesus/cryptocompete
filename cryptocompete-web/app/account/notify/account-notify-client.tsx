"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Pencil, TrendingUp, TrendingDown, Bell, Plus } from "lucide-react";
import { PremiumRequiredNotifyDialog } from "@/components/premium-required-notify-dialog";
import { PremiumRequiredNotifyEditDialog } from "@/components/premium-required-notify-edit-dialog";

interface PriceAlarm {
  publicId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  currency: string;
  isAbove: boolean;
  isRecurring: boolean;
  isTriggered: boolean;
  createdAt: string;
}

interface Translations {
  title: string;
  noAlarms: string;
  alarmDeleted: string;
  somethingWentWrong: string;
  oneTimeNotification: string;
  repeatNotification: string;
  addAlarm: string;
}

interface Props {
  alarms: PriceAlarm[];
  isPremium: boolean;
  translations: Translations;
}

export function AccountNotifyClient({ alarms, isPremium, translations: t }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showPremiumEditDialog, setShowPremiumEditDialog] = useState(false);

  const grouped = alarms.reduce<Record<string, PriceAlarm[]>>((acc, alarm) => {
    const key = alarm.symbol;
    if (!acc[key]) acc[key] = [];
    acc[key].push(alarm);
    return acc;
  }, {});

  const formatAlarmPrice = (value: number, currency: string) => {
    const decimals = value >= 10 ? 2 : 6;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  function handleEdit(alarm: PriceAlarm) {
    if (!isPremium) {
      setShowPremiumEditDialog(true);
      return;
    }
    router.push(`/trade/notify/${alarm.symbol.toLowerCase()}?edit=${alarm.publicId}`);
  }

  async function handleDelete(publicId: string) {
    setDeletingId(publicId);

    try {
      const response = await fetch(`/api/trade/price-alarm/${publicId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || t.somethingWentWrong);
        return;
      }

      toast.success(t.alarmDeleted);
      router.refresh();
    } catch {
      toast.error(t.somethingWentWrong);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {alarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4" />
              <p className="text-sm">{t.noAlarms}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([symbol, symbolAlarms]) => (
                <div key={symbol} className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    {symbolAlarms[0].name} ({symbol})
                  </h3>
                  <div className="space-y-2">
                    {symbolAlarms.map((alarm) => (
                      <div
                        key={alarm.publicId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex flex-col">
                          <span className="flex items-center gap-3 text-sm font-medium">
                            {alarm.isAbove ? (
                              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                            )}
                            {formatAlarmPrice(alarm.targetPrice, alarm.currency)}
                          </span>
                          <span className="text-xs text-muted-foreground pl-[calc(0.875rem+0.75rem)]">
                            {alarm.isRecurring ? t.repeatNotification : t.oneTimeNotification}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(alarm)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(alarm.publicId)}
                            disabled={deletingId === alarm.publicId}
                          >
                            {deletingId === alarm.publicId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isPremium ? (
            <Button asChild className="gap-2 mt-3">
              <Link href="/trade/notify">
                <Plus className="h-4 w-4" />
                {t.addAlarm}
              </Link>
            </Button>
          ) : (
            <Button className="gap-2 mt-3" onClick={() => setShowPremiumDialog(true)}>
              <Plus className="h-4 w-4" />
              {t.addAlarm}
            </Button>
          )}
        </CardContent>
      </Card>
      <PremiumRequiredNotifyDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
      <PremiumRequiredNotifyEditDialog
        open={showPremiumEditDialog}
        onOpenChange={setShowPremiumEditDialog}
      />
    </>
  );
}