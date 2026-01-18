import { notFound } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { getUser } from "@/lib/auth/get-user";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { CryptoDetailCard } from "./crypto-detail-card";
import { BuyPanel } from "@/components/buy-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function BuyDetailPage({ params }: Props) {
  const { symbol } = await params;
  const crypto = await getCryptocurrency(symbol);
  const user = await getUser();
  
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
        <BuyPanel
          symbol={crypto.symbol}
          name={crypto.name}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          isAuthenticated={!!user}
          balance={balance}
          supportedCurrencies={user?.supportedCurrencies ?? []}
          initialPrice={initialPrice}
        />
      </div>
    </div>
  );
}