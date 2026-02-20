import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getPublicTransactions } from "@/lib/leaderboard/get-public-transactions";
import { TransactionsList } from "@/components/transactions-list";

export const dynamic = "force-dynamic";

export default async function PublicTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await getUser();
  const t = await getTranslations("leaderboard");
  const sp = await searchParams;

  const userIsPremium = user ? isPremium(user) : false;

  if (!userIsPremium) {
    redirect("/leaderboard");
  }

  const transactions = await getPublicTransactions(decodedUsername);

  const backParams = new URLSearchParams();
  if (sp.page) backParams.set("page", sp.page);
  if (sp.pageSize) backParams.set("pageSize", sp.pageSize);
  const backHref = `/leaderboard/${encodeURIComponent(decodedUsername)}${backParams.toString() ? `?${backParams.toString()}` : ""}`;

  return (
    <TransactionsList
      title={t("userTransactions", { username: decodedUsername })}
      backHref={backHref}
      rank={transactions?.rank}
      transactions={transactions}
      isPremium={true}
    />
  );
}