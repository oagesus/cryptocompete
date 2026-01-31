import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicProfile } from "@/lib/leaderboard/get-public-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PublicProfileHero } from "@/components/public-profile-hero";
import { PublicHoldingsList } from "@/components/public-holdings-list";
import { BalanceCardPortfolio } from "@/components/balance-card-portfolio";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const t = await getTranslations("leaderboard");

  const profile = await getPublicProfile(decodedUsername);

  if (!profile) {
    notFound();
  }

  const rankBgStyles: Record<number, string> = {
    1: "bg-yellow-500/20",
    2: "bg-gray-400/20",
    3: "bg-amber-600/20",
  };

  const rankTextStyles: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  const isTopThree = profile.rank && profile.rank <= 3;

  const getRankSize = (rank: number) => {
    if (rank < 100) return "w-8 text-md";
    if (rank < 1000) return "w-9 text-sm";
    return "w-auto min-w-9 px-2 text-sm";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {profile.rank && (
              <div
                className={cn(
                  "flex h-8 items-center justify-center rounded-full font-bold shrink-0",
                  getRankSize(profile.rank),
                  isTopThree
                    ? `${rankBgStyles[profile.rank]} ${rankTextStyles[profile.rank]}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {profile.rank}
              </div>
            )}
            {profile.username}'s Portfolio
          </CardTitle>
        </CardHeader>
        <Separator />
        <PublicProfileHero
          username={profile.username}
          rank={profile.rank}
          balance={profile.balance}
          holdings={profile.holdings}
          currency={profile.currency}
          exchangeRate={profile.exchangeRate}
        />
        <Separator />
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("balance")}</h3>
            <BalanceCardPortfolio balance={profile.balance} currency={profile.currency} />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("holdings")}</h3>
            <PublicHoldingsList
              holdings={profile.holdings}
              currency={profile.currency}
              exchangeRate={profile.exchangeRate}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}