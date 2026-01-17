"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

interface SpendCardProps {
  value: string;
  currency: string;
  supportedCurrencies: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SpendCard({ value, currency, supportedCurrencies, onChange, disabled }: SpendCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleCurrencyChange(newCurrency: string) {
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
        setIsOpen(false);
        router.refresh();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">You Spend</span>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-16"
        />
        {disabled ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </span>
        ) : (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            >
              {currency}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto">
              {supportedCurrencies.map((code, index) => {
                const isSelected = code === currency;
                return (
                  <div key={code}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onSelect={() => handleCurrencyChange(code)}
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}