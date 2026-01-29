import Link from "next/link";
import { PlusCircle, MinusCircle, Wallet, User, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { Greeting } from "./greeting";

export default async function DashboardPage() {
  const user = await getUser();
  const t = await getTranslations("dashboard");

  const activeProfile = user!.profiles.find((p) => p.publicId === user!.activeProfileId)!;

  return (
    <div className="space-y-4">
      <Greeting username={activeProfile.username} />

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/trade/buy"
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
        >
          <PlusCircle className="h-12 w-12" />
          <span className="text-xl font-semibold">{t("buy")}</span>
        </Link>
        <Link
          href="/trade/sell"
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
        >
          <MinusCircle className="h-12 w-12" />
          <span className="text-xl font-semibold">{t("sell")}</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/account/profiles/${activeProfile.publicId}/portfolio`}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
        >
          <Wallet className="h-12 w-12" />
          <span className="text-xl font-semibold">{t("portfolio")}</span>
        </Link>
        <Link
          href={`/account/profiles/${activeProfile.publicId}`}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
        >
          <User className="h-12 w-12" />
          <span className="text-xl font-semibold">{t("profile")}</span>
        </Link>
      </div>

      <Link
        href="/leaderboard"
        className="flex items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50 w-full"
      >
        <Trophy className="h-12 w-12" />
        <span className="text-xl font-semibold">{t("leaderboard")}</span>
      </Link>
    </div>
  );
}