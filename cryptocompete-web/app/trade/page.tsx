import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { SellLink } from "./sell-link";
import { NotifyLink } from "./notify-link";

export default async function TradePage() {
  const user = await getUser();
  const isAuthenticated = !!user;
  const userIsPremium = user ? isPremium(user) : false;
  const t = await getTranslations("trade");

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <Link
        href="/trade/buy"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50"
      >
        <PlusCircle className="h-12 w-12" />
        <span className="text-xl font-semibold">{t("buy")}</span>
      </Link>
      <SellLink isAuthenticated={isAuthenticated} />
      <NotifyLink isAuthenticated={isAuthenticated} isPremium={userIsPremium} />
    </div>
  );
}