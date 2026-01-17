import { redirect } from "next/navigation";

import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { BalanceCardPortfolio } from "@/components/balance-card-portfolio";
import { PortfolioHero } from "@/components/portfolio-hero";
import { HoldingsList } from "@/components/holdings-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: publicId } = await params;
  const portfolio = await getPortfolio(publicId);

  if (!portfolio) {
    redirect("/account");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Portfolio</CardTitle>
        </CardHeader>
        <Separator />
        <PortfolioHero
          balance={portfolio.balance}
          holdings={portfolio.holdings}
          currency={portfolio.currency}
          exchangeRate={portfolio.exchangeRate}
        />
        <Separator />
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Balance</h3>
            <BalanceCardPortfolio balance={portfolio.balance} currency={portfolio.currency} />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Holdings</h3>
            <HoldingsList
              holdings={portfolio.holdings}
              currency={portfolio.currency}
              exchangeRate={portfolio.exchangeRate}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}