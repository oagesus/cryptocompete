import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getSubscriptionStatus } from "@/lib/subscription/get-subscription-status";
import { ProCheckoutForm } from "./pro-checkout-form";

export const dynamic = "force-dynamic";

export default async function ProCheckoutPage() {
  const user = await getUser();
  const locale = await getLocale();
  const t = await getTranslations("upgrade");

  if (!user) {
    redirect("/auth/clear");
  }

  if (isPremium(user)) {
    redirect("/upgrade");
  }

  const subStatus = await getSubscriptionStatus();

  const planAmount = subStatus?.planAmount ?? 5;
  const planCurrency = subStatus?.planCurrency ?? "EUR";

  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: planCurrency,
  }).format(planAmount);

  const freeFormatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: planCurrency,
    maximumFractionDigits: 0,
  }).format(0);

  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  const formattedRenewalDate = renewalDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const translations = {
    upgradeToPro: t("upgradeToPro"),
    orderDetails: t("orderDetails"),
    currentPlan: t("currentPlanLabel"),
    newPlan: t("newPlanLabel"),
    freePlan: t("freePlan"),
    proPlan: t("proPlan"),
    totalDueToday: t("totalDueToday"),
    autoRenewInfo: t("autoRenewInfo", { date: formattedRenewalDate, amount: formattedAmount }),
    paymentMethod: t("paymentMethod"),
    paypal: t("paypal"),
    upgradeButton: t("upgradeButton"),
    redirecting: t("redirecting"),
    agreementText: t("agreementText"),
    back: t("back"),
    month: t("month"),
    perMonth: t("perMonth"),
  };

  return (
    <ProCheckoutForm
      translations={translations}
      formattedAmount={formattedAmount}
      freeFormatted={freeFormatted}
    />
  );
}