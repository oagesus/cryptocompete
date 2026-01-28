"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CurrencyInfo } from "@/lib/currency/get-currency";

function getCurrencySymbol(code: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: code })
    .format(0)
    .replace(/[\d.,]/g, "")
    .trim();
}

function getCurrencyName(code: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
}

interface CurrencyToggleProps {
  currencyInfo: CurrencyInfo;
}

export function CurrencyToggle({ currencyInfo }: CurrencyToggleProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleCurrencyChange(newCurrency: string) {
    if (newCurrency === currencyInfo.currency) return;

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
        router.refresh();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading} className="cursor-pointer gap-1">
          <span>{currencyInfo.currency}</span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
          <span className="sr-only">Toggle currency</span>
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
  );
}