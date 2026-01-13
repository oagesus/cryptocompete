"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function getCurrencySymbol(code: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code })
    .format(0)
    .replace(/[\d.,]/g, "")
    .trim();
}

function getCurrencyName(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
}

interface CurrencyToggleIconProps {
  currentCurrency: string;
  supportedCurrencies: string[];
}

export function CurrencyToggleIcon({ currentCurrency, supportedCurrencies }: CurrencyToggleIconProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState(currentCurrency);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleCurrencyChange(e: Event, newCurrency: string) {
    e.preventDefault();
    if (newCurrency === currency) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ displayCurrency: newCurrency }),
      });

      if (response.ok) {
        setCurrency(newCurrency);
        setIsOpen(false);
        router.refresh();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger 
        disabled={isLoading} 
        className="flex-1 justify-center cursor-pointer [&>svg]:hidden"
      >
        <span>{currency}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto">
        {supportedCurrencies.map((code, index) => {
          const isSelected = code === currency;
          return (
            <div key={code}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={(e) => handleCurrencyChange(e, code)}
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
                  {getCurrencySymbol(code)}
                </div>
                <div className="flex flex-col flex-1 ml-2">
                  <span>{getCurrencyName(code)}</span>
                  <span className="text-sm text-muted-foreground">{code}</span>
                </div>
                <div className="w-6 ml-2 flex justify-center shrink-0">
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}