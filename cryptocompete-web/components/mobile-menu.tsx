"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { LayoutDashboard, Settings, User, LogOut, Wallet, TrendingUp, Trophy, CircleArrowUp, CreditCard, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleIcon } from "@/components/theme-toggle-icon";
import { CurrencyToggleIcon } from "@/components/currency-toggle-icon";
import { LanguageToggleIcon } from "@/components/language-toggle-icon";
import { User as UserType } from "@/lib/auth/get-user";
import { CurrencyInfo } from "@/lib/currency/get-currency";

interface MobileMenuProps {
  user: UserType;
  currencyInfo: CurrencyInfo;
}

export function MobileMenu({ user, currencyInfo }: MobileMenuProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);

  const activeProfile = user.profiles.find((p) => p.publicId === user.activeProfileId)!;

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <div className="relative h-5 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "top-[9px] rotate-45" : "top-1"
              }`}
            />
            <span
              className={`absolute left-0 top-[9px] block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "top-[9px] -rotate-45" : "top-[14px]"
              }`}
            />
          </div>
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{activeProfile.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          {t("dashboard")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/account/profiles/${activeProfile.publicId}/portfolio`)}
          className="cursor-pointer"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {t("portfolio")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/trade")}
          className="cursor-pointer"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {t("trade")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/leaderboard")}
          className="cursor-pointer"
        >
          <Trophy className="mr-2 h-4 w-4" />
          {t("leaderboard")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/upgrade")}
          className="cursor-pointer"
        >
          <CircleArrowUp className="mr-2 h-4 w-4" />
          {t("upgrade")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/account/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/account/billing")}
          className="cursor-pointer"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {t("billing")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/account/notify")}
          className="cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          {t("priceAlarms")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/account/profiles/${activeProfile.publicId}`)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4 text-destructive" />
          {t("logout")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center">
          <ThemeToggleIcon />
          <div className="w-px h-5 bg-border" />
          <CurrencyToggleIcon
            currentCurrency={currencyInfo.currency}
            supportedCurrencies={currencyInfo.supportedCurrencies}
          />
          <div className="w-px h-5 bg-border" />
          <LanguageToggleIcon currentLocale={locale} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}