import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getPublicTransactions } from "@/lib/leaderboard/get-public-transactions";
import { TransactionsList } from "@/components/transactions-list";

export const dynamic = "force-dynamic";

export default async function PublicTransactionsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await getUser();
  const t = await getTranslations("leaderboard");

  const userIsPremium = user ? isPremium(user) : false;

  if (!userIsPremium) {
    redirect("/leaderboard");
  }

  const transactions = await getPublicTransactions(decodedUsername);

  return (
    <TransactionsList
      title={t("userTransactions", { username: decodedUsername })}
      backHref={`/leaderboard/${encodeURIComponent(decodedUsername)}`}
      rank={transactions?.rank}
      transactions={transactions}
      isPremium={true}
    />
  );
}