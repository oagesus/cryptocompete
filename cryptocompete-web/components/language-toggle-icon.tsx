"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setLocale, locales, localeNames, Locale } from "@/lib/i18n";

function getLocaleShort(locale: Locale): string {
  return locale.split("-")[0].toUpperCase();
}

interface LanguageToggleIconProps {
  currentLocale: string;
}

export function LanguageToggleIcon({ currentLocale }: LanguageToggleIconProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(currentLocale);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleLocaleChange(e: Event, newLocale: Locale) {
    e.preventDefault();
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      await setLocale(newLocale);
      setLocaleState(newLocale);
      setIsOpen(false);
      router.refresh();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger
        disabled={isLoading}
        className="flex-1 justify-center cursor-pointer [&>svg.lucide-chevron-right]:hidden gap-1 text-foreground"
      >
        <Globe className="h-4 w-4 text-foreground" />
        <span>{getLocaleShort(locale as Locale)}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {locales.map((code, index) => {
          const isSelected = code === locale;
          return (
            <div key={code}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={(e) => handleLocaleChange(e, code)}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-muted font-medium"
                )}
              >
                <span className="flex-1">
                  {localeNames[code]} <span className="text-muted-foreground">({code})</span>
                </span>
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