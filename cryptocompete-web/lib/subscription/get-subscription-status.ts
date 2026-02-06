import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  cancelledButActive: boolean;
  canResubscribe: boolean;
  activeUntil: string | null;
  planAmount: number | null;
  planCurrency: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/subscription/status`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}