import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";
import { isPremium } from "@/lib/auth/user-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const user = await getUser();
  const locale = await getLocale();
  const t = await getTranslations("upgrade");

  if (!user) {
    redirect("/auth/clear");
  }

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

  const isCurrentPremium = user ? isPremium(user) : false;
  const isCurrentFree = !isCurrentPremium;

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
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-center">
        {t("title")}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {/* Free Plan */}
        <Card className="flex flex-col hover:border-foreground hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          <CardContent className="px-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{t("freePlan")}</h2>
                  <p className="text-base text-muted-foreground mt-0.5">
                    {t("freeSubtitle")}
                  </p>
                </div>
                {isCurrentFree && (
                  <Badge variant="default">{t("current")}</Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{freePrice}</span>
                <span className="text-sm text-muted-foreground">
                  / {t("month")}
                </span>
              </div>

              {isCurrentFree ? (
                <Button className="w-full h-11 text-base" disabled>
                  {t("currentPlan")}
                </Button>
              ) : (
                <Button className="w-full h-11 text-base">
                  {t("downgrade")}
                </Button>
              )}
            </div>
          </CardContent>

          <Separator />

          <CardContent className="p-6 space-y-3">
            <p className="text-base font-medium text-muted-foreground">
              {t("freeIncludes")}
            </p>
            <ul className="space-y-2.5">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col border-primary/40 hover:border-primary hover:shadow-[0_0_20px_rgba(75,107,251,0.35)]">
          <CardContent className="px-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{t("proPlan")}</h2>
                  <p className="text-base text-primary mt-0.5">
                    {t("proSubtitle")}
                  </p>
                </div>
                {isCurrentPremium && (
                  <Badge variant="default">{t("current")}</Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{proPrice}</span>
                <span className="text-sm text-muted-foreground">
                  / {t("month")} {t("billedMonthly")}
                </span>
              </div>

              {isCurrentPremium ? (
                <Button className="w-full h-11 text-base" disabled>
                  {t("currentPlan")}
                </Button>
              ) : (
                <Button className="w-full h-11 text-base">{t("upgrade")}</Button>
              )}
            </div>
          </CardContent>

          <Separator />

          <CardContent className="p-6 space-y-3">
            <p className="text-base font-medium text-muted-foreground">
              {t("proIncludes")}
            </p>
            <ul className="space-y-2.5">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("disclaimer")}
      </p>
    </div>
  );
}