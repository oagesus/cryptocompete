"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { User, Settings, LogOut, CircleArrowUp, CreditCard, Bell } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface UserMenuProps {
  user: UserType;
  currencyInfo: CurrencyInfo;
}

export function UserMenu({ user, currencyInfo }: UserMenuProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="hover:bg-accent">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{activeProfile.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
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