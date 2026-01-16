import { TradeLayoutClient } from "./trade-layout-client";

const API_URL = process.env.API_URL;

async function getAllCryptocurrencies() {
  try {
    const response = await fetch(`${API_URL}/api/cryptocurrencies/all`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

export default async function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cryptocurrencies = await getAllCryptocurrencies();

  return (
    <TradeLayoutClient cryptocurrencies={cryptocurrencies}>
      {children}
    </TradeLayoutClient>
  );
}