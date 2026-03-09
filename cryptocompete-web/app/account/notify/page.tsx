import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPriceAlarms } from "@/lib/trade/get-price-alarms";

export const metadata: Metadata = {
  title: "My Price Alarms",
  description: "View and manage your cryptocurrency price alarms on CryptoCompete.",
};
import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { AccountNotifyClient } from "./account-notify-client";

export default async function AccountNotifyPage() {
  const t = await getTranslations("account");
  const user = await getUser();
  const { alarms } = await getPriceAlarms();
  const userIsPremium = user ? isPremium(user) : false;

  const activeAlarms = alarms.filter((a) => !a.isTriggered || a.isRecurring);

  const translations = {
    title: t("priceAlarms"),
    noAlarms: t("noAlarms"),
    alarmDeleted: t("alarmDeleted"),
    somethingWentWrong: t("somethingWentWrong"),
    oneTimeNotification: t("oneTimeNotification"),
    repeatNotification: t("repeatNotification"),
    addAlarm: t("addAlarm"),
  };

  return (
    <AccountNotifyClient
      alarms={activeAlarms}
      isPremium={userIsPremium}
      translations={translations}
    />
  );
}