"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setLocale, locales, localeNames, Locale } from "@/lib/i18n";

function getLocaleShort(locale: string): string {
  return locale.split("-")[0].toUpperCase();
}

export function LanguageToggle() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLocaleChange(newLocale: Locale) {
    if (newLocale === currentLocale) return;

    setIsLoading(true);

    try {
      await setLocale(newLocale);
      router.refresh();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading} className="cursor-pointer gap-1">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span>{getLocaleShort(currentLocale)}</span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((code, index) => {
          const isSelected = code === currentLocale;
          return (
            <div key={code}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleLocaleChange(code)}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-muted font-medium"
                )}
              >
                <span className="flex-1">
                  {localeNames[code]} <span className="text-muted-foreground">({code})</span>
                </span>
                {isSelected && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}