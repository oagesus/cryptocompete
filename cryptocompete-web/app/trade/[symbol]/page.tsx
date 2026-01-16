import { notFound } from "next/navigation";
import { getCryptocurrency } from "@/lib/crypto/get-cryptocurrencies";
import { CryptoDetailCard } from "./crypto-detail-card";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function TradeDetailPage({ params }: Props) {
  const { symbol } = await params;
  const crypto = await getCryptocurrency(symbol);

  if (!crypto) {
    notFound();
  }

  return (
    <CryptoDetailCard
      symbol={crypto.symbol}
      name={crypto.name}
      initialPrice={crypto.price}
      initialChangePercent={crypto.changePercent24h}
      displayCurrency={crypto.currency}
      exchangeRate={crypto.exchangeRate}
    />
  );
}