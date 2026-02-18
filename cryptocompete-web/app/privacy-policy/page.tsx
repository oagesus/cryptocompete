import { useTranslations, useLocale } from "next-intl";
import { Separator } from "@/components/ui/separator";

const LAST_UPDATED = new Date("2026-02-18");

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacyPolicy");
  const locale = useLocale();

  const formattedDate = LAST_UPDATED.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sections = [
    { title: t("introTitle"), text: t("introText") },
    { text: t("ipCollection") },
    { title: t("dataStorageTitle"), text: t("dataStorageText") },
    { text: t("dataTransferText") },
    { text: t("dataRetentionText") },
    { title: t("cookiesTitle"), text: t("cookiesText") },
    { title: t("googleFontsTitle"), text: t("googleFontsText") },
    { title: t("serverLogTitle"), text: t("serverLogText") },
    { title: t("rightsTitle"), text: t("rightsText") },
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