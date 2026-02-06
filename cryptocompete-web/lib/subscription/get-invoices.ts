import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Invoice {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
}

export async function getInvoices(): Promise<Invoice[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/api/subscription/invoices`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}