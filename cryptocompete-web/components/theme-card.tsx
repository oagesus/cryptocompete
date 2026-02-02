"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ThemeCard() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("account");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle() {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
  }

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("theme")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <span className="text-sm font-medium">
            {isDark ? t("darkMode") : t("lightMode")}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="w-full md:w-auto"
            onClick={handleToggle}
          >
            {t("change")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}