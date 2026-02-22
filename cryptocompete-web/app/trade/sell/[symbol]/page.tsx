import { notFound, redirect } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getKlines } from "@/lib/crypto/get-klines";
import { getUser } from "@/lib/auth/get-user";
import { getCurrency } from "@/lib/currency/get-currency";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { SellPanel } from "@/components/sell-panel";
import { PriceChart } from "@/components/price-chart";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function SellDetailPage({ params }: Props) {
  const { symbol } = await params;
  const [crypto, klineData, user, currencyInfo] = await Promise.all([
    getCryptocurrency(symbol),
    getKlines(symbol, "1D"),
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

  if (!crypto) {
    notFound();
  }

  const holding = portfolio.holdings.find(
    (h) => h.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!holding || holding.amount <= 0) {
    redirect("/trade/sell");
  }

  const displayCurrency = portfolio.currency;
  const exchangeRate = portfolio.exchangeRate;
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