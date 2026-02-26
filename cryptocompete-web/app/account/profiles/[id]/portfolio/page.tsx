import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getPortfolio } from "@/lib/portfolio/get-portfolio";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { BalanceCardPortfolio } from "@/components/balance-card-portfolio";
import { PortfolioHero } from "@/components/portfolio-hero";
import { HoldingsList } from "@/components/holdings-list";
import { ViewTransactionsLink } from "@/components/view-transactions-link";
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
  const user = await getUser();
  const t = await getTranslations("account");

  if (!portfolio || !user) {
    redirect("/account");
  }

  const userIsPremium = isPremium(user);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t("portfolio")}</CardTitle>
        </CardHeader>
        <Separator />
        <PortfolioHero
          balance={portfolio.balance}
          holdings={portfolio.holdings}
          currency={portfolio.currency}
          exchangeRate={portfolio.exchangeRate}
        />
        <Separator />
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-lg font-semibold">{t("balance")}</h3>
          <BalanceCardPortfolio balance={portfolio.balance} currency={portfolio.currency} />
        </CardContent>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold px-6 pt-6">{t("holdings", { count: portfolio.holdings.length })}</h3>
          <HoldingsList
            holdings={portfolio.holdings}
            currency={portfolio.currency}
            exchangeRate={portfolio.exchangeRate}
          />
        </div>

        <div className="px-6">
          <ViewTransactionsLink
            href={`/account/profiles/${publicId}/portfolio/transactions`}
            isPremium={userIsPremium}
            label={t("viewTransactions")}
          />
        </div>
      </Card>
    </div>
  );
}