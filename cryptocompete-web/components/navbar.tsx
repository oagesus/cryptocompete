import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { getCurrency } from "@/lib/currency/get-currency";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencyToggle } from "@/components/currency-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileMenuPublic } from "@/components/mobile-menu-public";

export async function Navbar() {
  const [user, currencyInfo] = await Promise.all([
    getUser(),
    getCurrency(),
  ]);
  const t = await getTranslations("nav");

  const activeProfile = user?.profiles.find((p) => p.publicId === user.activeProfileId);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm px-6">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="text-2xl font-thin">
          CryptoCompete
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href={`/account/profiles/${activeProfile?.publicId}/portfolio`}>{t("portfolio")}</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/trade">{t("trade")}</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/leaderboard">{t("leaderboard")}</Link>
              </Button>
              <div className="hidden md:block">
                <UserMenu user={user} currencyInfo={currencyInfo} />
              </div>
              <div className="md:hidden">
                <MobileMenu user={user} currencyInfo={currencyInfo} />
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/trade/buy">{t("trade")}</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/leaderboard">{t("leaderboard")}</Link>
              </Button>
              <div className="hidden md:block w-px h-5 bg-border" />
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/auth/login">{t("login")}</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/auth/register">{t("register")}</Link>
              </Button>
              <div className="hidden md:flex items-center gap-1">
                <ThemeToggle />
                <CurrencyToggle currencyInfo={currencyInfo} />
                <LanguageToggle />
              </div>
              <div className="md:hidden">
                <MobileMenuPublic currencyInfo={currencyInfo} />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}