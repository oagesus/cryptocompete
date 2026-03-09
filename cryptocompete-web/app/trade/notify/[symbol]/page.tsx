import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getKlines } from "@/lib/crypto/get-klines";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getCurrency } from "@/lib/currency/get-currency";
import { getPriceAlarms } from "@/lib/trade/get-price-alarms";
import { NotifyPanel } from "@/components/notify-panel";
import { PriceChart } from "@/components/price-chart";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  return {
    title: `${upper} Price Alarm`,
    description: `Set a price alarm for ${upper} on CryptoCompete. Get notified when the price hits your target.`,
  };
}

export default async function NotifyDetailPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { edit: editAlarmId } = await searchParams;
  const [crypto, klineData, user, currencyInfo] = await Promise.all([
    getCryptocurrency(symbol),
    getKlines(symbol, "1D"),
    getUser(),
    getCurrency(),
  ]);

  if (!user) {
    redirect("/auth/clear");
  }

  const userIsPremium = isPremium(user);

  if (!userIsPremium) {
    redirect("/trade");
  }

  if (!crypto) {
    notFound();
  }

  const { alarms } = await getPriceAlarms();

  return (
    <div className="flex flex-col gap-6">
      <PriceChart
        symbol={crypto.symbol}
        name={crypto.name}
        initialKlines={klineData?.klines}
        initialTimeframe="1D"
        initialPriceUsd={crypto.priceUsd}
        initialChangePercent24h={crypto.changePercent24h}
        displayCurrency={crypto.currency}
        exchangeRate={crypto.exchangeRate}
        percentChange7d={crypto.percentChange7d}
        percentChange30d={crypto.percentChange30d}
        percentChange90d={crypto.percentChange90d}
        marketCap={crypto.marketCap}
      />
      <NotifyPanel
        symbol={crypto.symbol}
        name={crypto.name}
        displayCurrency={crypto.currency}
        exchangeRate={crypto.exchangeRate}
        initialPriceUsd={crypto.priceUsd}
        supportedCurrencies={currencyInfo.supportedCurrencies}
        alarms={alarms}
        editAlarmId={editAlarmId}
      />
    </div>
  );
}