import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { getSubscriptionStatus } from "@/lib/subscription/get-subscription-status";
import { UpgradeCards } from "@/components/upgrade-cards";

function formatDate(dateStr: string, locale: string): string {
  const formatted = new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return formatted.replace(/ /g, "\u00A0");
}

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const user = await getUser();
  const locale = await getLocale();
  const t = await getTranslations("upgrade");

  if (!user) {
    redirect("/auth/clear");
  }

  const isCurrentPremium = isPremium(user);

  const subStatus = isCurrentPremium
    ? await getSubscriptionStatus()
    : null;

  const freePrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(0);

  const proPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(5);

  const freeFeatures = [
    t("freeFeature1"),
    t("freeFeature2"),
    t("freeFeature3"),
    t("freeFeature4"),
    t("freeFeature5"),
  ];

  const proFeatures = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
  ];

  const formattedActiveUntil = subStatus?.activeUntil
    ? formatDate(subStatus.activeUntil, locale)
    : null;

  const formattedPeriodEnd = subStatus?.currentPeriodEnd
    ? formatDate(subStatus.currentPeriodEnd, locale)
    : null;

  const daysRemaining = subStatus?.activeUntil
    ? Math.max(0, Math.ceil((new Date(subStatus.activeUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const translations = {
    title: t("title"),
    freePlan: t("freePlan"),
    freeSubtitle: t("freeSubtitle"),
    proPlan: t("proPlan"),
    proSubtitle: t("proSubtitle"),
    current: t("current"),
    month: t("month"),
    billedMonthly: t("billedMonthly"),
    currentPlan: t("currentPlan"),
    downgrade: t("downgrade"),
    upgrade: t("upgrade"),
    freeIncludes: t("freeIncludes"),
    proIncludes: t("proIncludes"),
    disclaimer: t("disclaimer"),
    cancelConfirmTitle: t("cancelConfirmTitle"),
    cancelConfirmLine1: t("cancelConfirmLine1"),
    cancelConfirmLine2: t("cancelConfirmLine2", { date: formattedPeriodEnd ?? "" }),
    cancelConfirmButton: t("cancelConfirmButton"),
    cancelKeepButton: t("cancelKeepButton"),
    cancelling: t("cancelling"),
    cancelSuccess: t("cancelSuccess"),
    cancelError: t("cancelError"),
    subscribing: t("subscribing"),
    endsIn: daysRemaining !== null ? t("endsIn", { days: daysRemaining }) : "",
    endsInTemplate: t("endsIn", { days: "{days}" }),
    resubscribe: t("resubscribe"),
    resubscribeConfirmTitle: t("resubscribeConfirmTitle"),
    resubscribeConfirmDescription: t("resubscribeConfirmDescription", { date: formattedPeriodEnd ?? "" }),
    resubscribeConfirmButton: t("resubscribeConfirmButton"),
    resubscribeCancelButton: t("resubscribeCancelButton"),
    resubscribing: t("resubscribing"),
    resubscribeSuccess: t("resubscribeSuccess"),
    resubscribeError: t("resubscribeError"),
  };

  return (
    <UpgradeCards
      isCurrentPremium={isCurrentPremium}
      cancelledButActive={subStatus?.cancelledButActive ?? false}
      canResubscribe={subStatus?.canResubscribe ?? false}
      activeUntil={formattedActiveUntil}
      daysRemaining={daysRemaining}
      freePrice={freePrice}
      proPrice={proPrice}
      freeFeatures={freeFeatures}
      proFeatures={proFeatures}
      translations={translations}
    />
  );
}