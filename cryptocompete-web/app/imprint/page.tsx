import { useTranslations, useLocale } from "next-intl";
import { Separator } from "@/components/ui/separator";

const LAST_UPDATED = new Date("2026-02-18");

export default function ImprintPage() {
  const t = useTranslations("imprint");
  const locale = useLocale();

  const formattedDate = LAST_UPDATED.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sections = [
    {
      title: t("operatorTitle"),
      text: `${t("name")}\n${t("address")}`,
    },
    { title: t("contactTitle"), text: t("contactEmail") },
    { title: t("disclaimerTitle"), text: t("disclaimerText") },
    { title: t("liabilityLinksTitle"), text: t("liabilityLinksText") },
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