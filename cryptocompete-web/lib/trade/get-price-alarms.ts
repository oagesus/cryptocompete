import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface PriceAlarm {
  id: number;
  symbol: string;
  name: string;
  targetPrice: number;
  currency: string;
  isAbove: boolean;
  isRecurring: boolean;
  isTriggered: boolean;
  createdAt: string;
}

export interface PriceAlarmsResponse {
  alarms: PriceAlarm[];
}

export async function getPriceAlarms(): Promise<PriceAlarmsResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return { alarms: [] };
  }

  try {
    const response = await fetch(`${API_URL}/api/trade/price-alarms`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return { alarms: [] };
    }

    return response.json();
  } catch {
    return { alarms: [] };
  }
}