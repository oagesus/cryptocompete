import { notFound, redirect } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getUser } from "@/lib/auth/get-user";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { CryptoDetailCard } from "./crypto-detail-card";
import { SellPanel } from "@/components/sell-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function SellDetailPage({ params }: Props) {
  const { symbol } = await params;
  const crypto = await getCryptocurrency(symbol);
  const user = await getUser();

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
  const initialPrice = crypto.price;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <CryptoDetailCard
          symbol={crypto.symbol}
          name={crypto.name}
          initialPrice={crypto.price}
          initialChangePercent={crypto.changePercent24h}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />
      </div>
      <div className="w-full lg:w-80 shrink-0">
        <SellPanel
          symbol={crypto.symbol}
          name={crypto.name}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          holdingAmount={holding.amount}
          initialPrice={initialPrice}
          supportedCurrencies={user.supportedCurrencies}
        />
      </div>
    </div>
  );
}