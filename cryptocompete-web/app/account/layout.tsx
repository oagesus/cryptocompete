import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { getCurrency } from "@/lib/currency/get-currency";
import { AccountLayoutClient } from "./account-layout-client";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, currencyInfo] = await Promise.all([
    getUser(),
    getCurrency(),
  ]);

  if (!user) {
    redirect("/auth/clear");
  }

  return (
    <AccountLayoutClient initialData={user} initialCurrencyInfo={currencyInfo}>
      {children}
    </AccountLayoutClient>
  );
}