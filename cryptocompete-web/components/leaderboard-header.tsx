import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getTimezone } from "@/lib/timezone/get-timezone";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardCountdown } from "./leaderboard-countdown";

interface LeaderboardHeaderProps {
  calculatedAt: string | null;
}

function roundToNearestHour(date: Date): Date {
  const rounded = new Date(date);
  if (rounded.getMinutes() >= 59) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else if (rounded.getMinutes() === 0 && rounded.getSeconds() <= 60) {
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
}

function calculateMinutesUntilNextHour(timezone: string): number {
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const nextHour = new Date(nowInTz);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const diff = nextHour.getTime() - nowInTz.getTime();
  return Math.ceil(diff / 1000 / 60);
}

export async function LeaderboardHeader({ calculatedAt }: LeaderboardHeaderProps) {
  const t = await getTranslations("leaderboard");
  const cookieStore = await cookies();
  const timezone = await getTimezone();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en-US";

  const lastUpdated = calculatedAt
    ? roundToNearestHour(new Date(calculatedAt)).toLocaleString(locale, {
        timeZone: timezone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const initialMinutes = calculateMinutesUntilNextHour(timezone);

  return (
    <CardHeader className="pb-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        {lastUpdated && (
          <div className="flex flex-col text-sm text-muted-foreground md:text-right">
            <span>{t("updated", { date: lastUpdated })}</span>
            <LeaderboardCountdown initialMinutes={initialMinutes} />
          </div>
        )}
      </div>
    </CardHeader>
  );
}