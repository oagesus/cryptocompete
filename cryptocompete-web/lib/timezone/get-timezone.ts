import { cookies } from "next/headers";

export async function getTimezone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("timezone")?.value || "UTC";
}