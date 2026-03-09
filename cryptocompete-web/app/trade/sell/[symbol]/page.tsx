import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getKlines } from "@/lib/crypto/get-klines";
import { getUser } from "@/lib/auth/get-user";
import { getCurrency } from "@/lib/currency/get-currency";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { SellPanel } from "@/components/sell-panel";
import { PriceChart } from "@/components/price-chart";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const upper = decodeURIComponent(symbol).toUpperCase();
  return {
    title: `Sell ${upper}`,
    description: `Sell your virtual ${upper} holdings on CryptoCompete.`,
  };
}

export default async function SellDetailPage({ params }: Props) {
  const { symbol } = await params;
  const [user, currencyInfo] = await Promise.all([
    getUser(),
    getCurrency(),
  ]);

  if (!user?.activeProfileId) {
    redirect("/account");
  }

  const portfolio = await getPortfolio(user.activeProfileId);

  if (!portfolio) {
    redirect("/account");
  }

  const holding = portfolio.holdings.find(
    (h) => h.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!holding || holding.amount <= 0) {
    redirect("/trade/sell");
  }

  const isDelisted = holding.isDelisted;
  const displayCurrency = portfolio.currency;
  const exchangeRate = portfolio.exchangeRate;
  const minTradeAmount = Math.round(currencyInfo.eurExchangeRate * 100) / 100;

  if (isDelisted) {
    const t = await getTranslations("trade");

    const delistedValue = holding.delistedValueInUserCurrency;
    const delistedPriceInUserCurrency = delistedValue != null && holding.amount > 0
      ? delistedValue / holding.amount
      : null;

    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex gap-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="leading-5">{t("delistedNotice", { symbol: holding.symbol })}</p>
          </CardContent>
        </Card>
        <SellPanel
          symbol={holding.symbol}
          name={holding.name}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          holdingAmount={holding.amount}
          holdingAmountRaw={holding.amountRaw}
          initialPriceUsd={holding.priceUsd}
          supportedCurrencies={currencyInfo.supportedCurrencies}
          minTradeAmount={minTradeAmount}
          isDelisted
          delistedPriceInUserCurrency={delistedPriceInUserCurrency}
        />
      </div>
    );
  }

  const [crypto, klineData] = await Promise.all([
    getCryptocurrency(symbol),
    getKlines(symbol, "1D"),
  ]);

  if (!crypto) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PriceChart
        symbol={crypto.symbol}
        name={crypto.name}
        initialKlines={klineData?.klines}
        initialTimeframe="1D"
        initialPriceUsd={crypto.priceUsd}
        initialChangePercent24h={crypto.changePercent24h}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        percentChange7d={crypto.percentChange7d}
        percentChange30d={crypto.percentChange30d}
        percentChange90d={crypto.percentChange90d}
        marketCap={crypto.marketCap}
      />
      <SellPanel
        symbol={crypto.symbol}
        name={crypto.name}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        holdingAmount={holding.amount}
        holdingAmountRaw={holding.amountRaw}
        initialPriceUsd={crypto.priceUsd}
        supportedCurrencies={currencyInfo.supportedCurrencies}
        minTradeAmount={minTradeAmount}
      />
    </div>
  );
}