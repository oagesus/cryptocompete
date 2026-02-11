import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Trophy,
  LineChart,
  Clock,
  Bell,
  Zap,
  Github,
  Star,
} from "lucide-react";

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations("home");

  const startingCapital = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(10000);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex flex-col items-start pb-6 text-left md:items-center md:text-center md:py-16">
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
          <div className="absolute left-0 top-0 flex flex-col gap-4 opacity-20">
            {Array.from({ length: 10 }).map((_, row) => (
              <div key={row} className="flex gap-4">
                {Array.from({ length: 14 }).map((_, col) => (
                  <div key={col} className="h-1 w-1 rounded-full bg-muted-foreground" />
                ))}
              </div>
            ))}
            {Array.from({ length: 8 }).map((_, row) => (
              <div key={row} className="flex gap-4">
                {Array.from({ length: 10 }).map((_, col) => (
                  <div key={col} className="h-1 w-1 rounded-full bg-muted-foreground" />
                ))}
              </div>
            ))}
          </div>
          <div className="absolute right-0 top-1/3 flex -translate-y-1/2 flex-col items-end gap-4 opacity-20">
            {Array.from({ length: 10 }).map((_, row) => (
              <div key={row} className="flex gap-4">
                {Array.from({ length: 10 }).map((_, col) => (
                  <div key={col} className="h-1 w-1 rounded-full bg-muted-foreground" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          {t("hero.title")}{" "}
          <span className="text-primary">{t("hero.titleHighlight")}</span>
          <br />
          {t("hero.titleEnd")}
        </h1>

        <p className="mt-6 md:mt-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t("hero.description", { startingCapital })}
        </p>

        <div className="mt-6 md:mt-10 flex w-full flex-col items-center justify-center gap-4 md:w-auto md:flex-row">
          <Button size="lg" className="h-15 w-full px-10 text-lg md:w-48" asChild>
            <Link href="/auth/register">{t("buttons.signUp")}</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-15 w-full px-10 text-lg md:w-48" asChild>
            <Link href="/trade/buy">
              {t("buttons.startTrading")}
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-6 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <Zap className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.riskFree.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.riskFree.description", { startingCapital })}
            </p>
          </div>

          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <LineChart className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.liveTracking.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.liveTracking.description")}
            </p>
          </div>

          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <Clock className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.priceHistory.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.priceHistory.description")}
            </p>
          </div>

          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <Bell className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.priceAlarms.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.priceAlarms.description")}
            </p>
          </div>

          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <Trophy className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.leaderboard.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.leaderboard.description")}
            </p>
          </div>

          <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-muted">
            <TrendingUp className="h-10 w-10 text-primary" />
            <div className="mt-4 inline-block">
              <h3 className="text-lg font-semibold">
                {t("features.portfolio.title")}
              </h3>
              <div className="mt-2 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("features.portfolio.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center py-6 md:py-16 text-center">
        <div className="flex items-center gap-3">
          <Github className="h-10 w-10" />
          <h2 className="text-3xl font-bold">{t("openSource.title")}</h2>
        </div>
        <p className="mt-6 max-w-xl text-muted-foreground">
          {t("openSource.description")}{" "}
          <a
            href="https://github.com/oagesus/cryptocompete/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-primary hover:underline"
          >
            {t("openSource.mitLicense")}
          </a>{" "}
          {t("openSource.on")}{" "}
          <a
            href="https://github.com/oagesus/cryptocompete"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t("openSource.github")}
          </a>
          .
        </p>
        <Button size="lg" className="mt-8 h-13 gap-2 bg-primary/10 px-8 text-base text-primary hover:bg-primary/20" asChild>
          <a
            href="https://github.com/oagesus/cryptocompete"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Star className="h-5 w-5" />
            {t("openSource.starOnGithub")}
          </a>
        </Button>
        <a
          href="https://github.com/oagesus/cryptocompete"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 inline-flex flex-col items-center text-sm text-muted-foreground hover:text-primary"
        >
          {t("openSource.checkOutSource")}
          <div className="mt-4 h-0.5 w-12 bg-primary transition-all duration-200 group-hover:w-full" />
        </a>
      </section>
    </div>
  );
}