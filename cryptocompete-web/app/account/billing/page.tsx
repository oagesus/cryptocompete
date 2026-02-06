import { getLocale } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getSubscriptionStatus } from "@/lib/subscription/get-subscription-status";
import { getInvoices } from "@/lib/subscription/get-invoices";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  const premium = isPremium(user);
  const locale = await getLocale();

  const subStatus = premium
    ? await getSubscriptionStatus()
    : null;

  const invoices = await getInvoices();

  const formattedPrice = subStatus?.planAmount
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: subStatus.planCurrency ?? "EUR",
      }).format(subStatus.planAmount)
    : null;

  const formattedPeriodEnd = subStatus?.currentPeriodEnd
    ? new Date(subStatus.currentPeriodEnd).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <BillingClient
      premium={premium}
      subStatus={subStatus}
      formattedPrice={formattedPrice}
      formattedPeriodEnd={formattedPeriodEnd}
      invoices={invoices}
      locale={locale}
    />
  );
}