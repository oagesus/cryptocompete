import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("token_exp");
  cookieStore.delete("pendingVerificationEmail");
  cookieStore.delete("verificationLastSentAt");

  redirect("/auth/login");
}