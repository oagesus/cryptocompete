import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the CryptoCompete terms of service. Understand the rules and conditions for using our free crypto trading simulator.",
};

const LAST_UPDATED = new Date("2026-02-18");

export default function TermsOfServicePage() {
  const t = useTranslations("termsOfService");
  const locale = useLocale();

  const formattedDate = LAST_UPDATED.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sections = [
    { title: t("introTitle"), text: t("introText") },
    { title: t("accountTitle"), text: t("accountText") },
    { title: t("virtualTradingTitle"), text: t("virtualTradingText") },
    { title: t("subscriptionTitle"), text: t("subscriptionText") },
    { title: t("liabilityTitle"), text: t("liabilityText") },
    { title: t("conductTitle"), text: t("conductText") },
    { title: t("changesTitle"), text: t("changesText") },
    {
      title: t("contactTitle"),
      text: `${t("operator")}\n${t("contactEmail")}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted-foreground">
          {t("lastUpdated", { date: formattedDate })}
        </span>
      </div>
      <Separator />
      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {section.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}