import { notFound, redirect } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getAllKlines } from "@/lib/crypto/get-klines";
import { getUser } from "@/lib/auth/get-user";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { SellPanel } from "@/components/sell-panel";
import { PriceChart } from "@/components/price-chart";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function SellDetailPage({ params }: Props) {
  const { symbol } = await params;
  const [crypto, allKlines, user] = await Promise.all([
    getCryptocurrency(symbol),
    getAllKlines(symbol),
    getUser(),
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

  return (
    <div className="flex flex-col gap-6">
      <PriceChart
        symbol={crypto.symbol}
        name={crypto.name}
        allKlines={allKlines}
        initialPriceUsd={crypto.priceUsd}
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
        initialPriceUsd={crypto.priceUsd}
        supportedCurrencies={user.supportedCurrencies}
      />
    </div>
  );
}