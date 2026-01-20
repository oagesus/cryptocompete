import { BuyLayoutClient } from "./buy-layout-client";
import { getAllCryptocurrencies } from "@/lib/crypto/get-cryptocurrencies";

export default async function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cryptocurrencies, currency, exchangeRate } = await getAllCryptocurrencies();

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