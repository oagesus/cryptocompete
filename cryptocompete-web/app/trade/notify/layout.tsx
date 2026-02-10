import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getAllCryptocurrencies } from "@/lib/crypto/get-cryptocurrencies";
import { NotifyLayoutClient } from "./notify-layout-client";

export const dynamic = "force-dynamic";

export default async function NotifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  const userIsPremium = isPremium(user);

  if (!userIsPremium) {
    redirect("/trade");
  }

  const { cryptocurrencies, currency, exchangeRate } = await getAllCryptocurrencies();

  return (
    <NotifyLayoutClient
      cryptocurrencies={cryptocurrencies}
      currency={currency}
      exchangeRate={exchangeRate}
    >
      {children}
    </NotifyLayoutClient>
  );
}