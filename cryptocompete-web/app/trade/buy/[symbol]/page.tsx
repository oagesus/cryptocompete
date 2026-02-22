import { notFound } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getKlines } from "@/lib/crypto/get-klines";
import { getUser } from "@/lib/auth/get-user";
import { getCurrency } from "@/lib/currency/get-currency";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { BuyPanel } from "@/components/buy-panel";
import { PriceChart } from "@/components/price-chart";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function BuyDetailPage({ params }: Props) {
  const { symbol } = await params;
  const [crypto, klineData, user, currencyInfo] = await Promise.all([
    getCryptocurrency(symbol),
    getKlines(symbol, "1D"),
    getUser(),
    getCurrency(),
  ]);

  let balance: number | null = null;
  let portfolioCurrency: string | null = null;
  let portfolioExchangeRate: number | null = null;

  if (user?.activeProfileId) {
    const portfolio = await getPortfolio(user.activeProfileId);
    if (portfolio) {
      balance = portfolio.balance;
      portfolioCurrency = portfolio.currency;
      portfolioExchangeRate = portfolio.exchangeRate;
    }
  }

  if (!crypto) {
    notFound();
  }

  const displayCurrency = portfolioCurrency ?? crypto.currency;
  const exchangeRate = portfolioExchangeRate ?? crypto.exchangeRate;
  const minTradeAmount = Math.round(currencyInfo.eurExchangeRate * 100) / 100;

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
      />
      <BuyPanel
        symbol={crypto.symbol}
        name={crypto.name}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
        isAuthenticated={!!user}
        balance={balance}
        supportedCurrencies={currencyInfo.supportedCurrencies}
        initialPriceUsd={crypto.priceUsd}
        minTradeAmount={minTradeAmount}
      />
    </div>
  );
}