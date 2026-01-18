import { BuyLayoutClient } from "./buy-layout-client";
import { getUser } from "@/lib/auth/get-user";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { getAllCryptocurrencies } from "@/lib/crypto/get-cryptocurrencies";

export default async function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cryptocurrencies = await getAllCryptocurrencies();
  const user = await getUser();

  let currency = "USD";
  let exchangeRate = 1;

  if (user?.activeProfileId) {
    const portfolio = await getPortfolio(user.activeProfileId);
    if (portfolio) {
      currency = portfolio.currency;
      exchangeRate = portfolio.exchangeRate;
    }
  }

  return (
    <BuyLayoutClient 
      cryptocurrencies={cryptocurrencies}
      currency={currency}
      exchangeRate={exchangeRate}
    >
      {children}
    </BuyLayoutClient>
  );
}