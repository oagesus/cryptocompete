"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Check } from "lucide-react";
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
import { setLocale, locales, localeNames, Locale } from "@/lib/i18n";

export function LanguageCard() {
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleLocaleChange(newLocale: Locale) {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      await setLocale(newLocale);
      setIsOpen(false);
      router.refresh();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("language")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <span className="text-sm font-medium">
            {localeNames[currentLocale as Locale]}
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
                        {localeNames[code]}{" "}
                        <span className="text-muted-foreground">({code})</span>
                      </span>
                      {isSelected && <Check className="h-4 w-4 ml-2" />}
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