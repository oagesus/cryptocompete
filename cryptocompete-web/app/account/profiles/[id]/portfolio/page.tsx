import { redirect } from "next/navigation";

import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { BalanceCard } from "@/components/balance-card";
import { HoldingCard } from "@/components/holding-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Balance</h3>
            <BalanceCard balance={portfolio.balance} currency={portfolio.currency} />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Holdings</h3>

            {portfolio.holdings.length === 0 ? (
              <Card>
                <CardContent className="px-4">
                  <p className="text-sm text-muted-foreground">
                    No holdings yet. Start trading to build your portfolio!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {portfolio.holdings.map((holding) => (
                  <HoldingCard
                    key={holding.symbol}
                    symbol={holding.symbol}
                    name={holding.name}
                    amount={holding.amount}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}