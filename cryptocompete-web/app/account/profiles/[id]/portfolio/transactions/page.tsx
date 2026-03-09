import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "Transactions",
  description: "View your crypto trading transaction history on CryptoCompete.",
};
import { isPremium } from "@/lib/auth/user-utils";
import { getTransactions } from "@/lib/transactions/get-transactions";
import { TransactionsList } from "@/components/transactions-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = user.profiles.find((p) => p.publicId === id);
  if (!profile) {
    redirect("/account");
  }

  const userIsPremium = isPremium(user);

  if (!userIsPremium) {
    redirect(`/account/profiles/${id}/portfolio`);
  }

  const transactions = await getTransactions(id);

  return (
    <TransactionsList
      transactions={transactions}
      isPremium={true}
    />
  );
}