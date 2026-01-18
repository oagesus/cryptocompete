import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { SellLayoutClient } from "./sell-layout-client";

export const dynamic = "force-dynamic";

export default async function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.activeProfileId) {
    redirect("/account");
  }

  const portfolio = await getPortfolio(user.activeProfileId);

  if (!portfolio) {
    redirect("/account");
  }

  return (
    <SellLayoutClient 
      holdings={portfolio.holdings}
      currency={portfolio.currency}
      exchangeRate={portfolio.exchangeRate}
    >
      {children}
    </SellLayoutClient>
  );
}