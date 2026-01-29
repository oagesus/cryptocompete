import { getTranslations } from "next-intl/server";
import { getTimezone } from "@/lib/timezone/get-timezone";

interface GreetingProps {
  username: string;
}

export async function Greeting({ username }: GreetingProps) {
  const t = await getTranslations("dashboard");
  const timezone = await getTimezone();

  const hour = new Date().toLocaleString("en-US", { 
    timeZone: timezone, 
    hour: "numeric", 
    hour12: false 
  });
  const currentHour = parseInt(hour, 10);

  const greetingKeys = getGreetingKeys(currentHour);
  const randomKey = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
  const greetingText = t(`${randomKey}.text`);
  const punctuation = t(`${randomKey}.punctuation`);

  return (
    <div className="flex flex-wrap gap-x-2 mb-2 min-w-0">
      <h1 className="text-2xl font-bold">{greetingText}</h1>
      <span className="text-2xl font-bold truncate">{username}{punctuation}</span>
    </div>
  );
}

function getGreetingKeys(hour: number): string[] {
  const generic = [
    "greetings.hey",
    "greetings.welcomeBack",
    "greetings.niceToSeeYou",
    "greetings.readyToTrade",
    "greetings.whatsUp",
  ];

  if (hour >= 5 && hour < 12) {
    return [
      ...generic,
      "greetings.goodMorning",
      "greetings.morningCoffee",
      "greetings.earlyBird",
      "greetings.freshStart",
    ];
  }

  if (hour >= 12 && hour < 17) {
    return [
      ...generic,
      "greetings.goodAfternoon",
    ];
  }

  if (hour >= 17 && hour < 22) {
    return [
      ...generic,
      "greetings.goodEvening",
      "greetings.eveningSession",
      "greetings.stillAtIt",
    ];
  }

  return [
    ...generic,
    "greetings.lateNight",
    "greetings.nightOwl",
    "greetings.cantSleep",
    "greetings.burningMidnightOil",
  ];
}