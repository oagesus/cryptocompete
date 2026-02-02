"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Coins, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAccount } from "@/components/account-provider";

function getCurrencySymbol(code: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: code })
    .format(0)
    .replace(/[\d.,]/g, "")
    .trim();
}

function getCurrencyName(code: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
}

export function CurrencyCard() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("account");
  const { currencyInfo } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleCurrencyChange(newCurrency: string) {
    if (newCurrency === currencyInfo.currency) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/currency", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (response.ok) {
        setIsOpen(false);
        router.refresh();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("currency")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <span className="text-sm font-medium">
            {getCurrencyName(currencyInfo.currency, locale)}
          </span>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {t("change")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto">
              {currencyInfo.supportedCurrencies.map((code, index) => {
                const isSelected = code === currencyInfo.currency;
                return (
                  <div key={code}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleCurrencyChange(code)}
                      className={cn(
                        "cursor-pointer group",
                        isSelected && "bg-muted font-medium"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium shrink-0",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted group-hover:bg-primary group-hover:text-primary-foreground"
                      )}>
                        {getCurrencySymbol(code, locale)}
                      </div>
                      <div className="flex flex-col flex-1 ml-2">
                        <span>{getCurrencyName(code, locale)}</span>
                        <span className="text-sm text-muted-foreground">{code}</span>
                      </div>
                      <div className="w-6 ml-2 flex justify-center shrink-0">
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}