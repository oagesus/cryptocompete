import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckEmailForm } from "./check-email-form";

const RESEND_COOLDOWN = 60;

export default async function CheckEmailPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get("pendingVerificationEmail")?.value;

  if (!email) {
    redirect("/auth/register");
  }

  const lastSentAt = cookieStore.get("verificationLastSentAt")?.value;
  let initialCooldown = 0;

  if (lastSentAt) {
    const elapsed = Math.floor((Date.now() - parseInt(lastSentAt, 10)) / 1000);
    const remaining = RESEND_COOLDOWN - elapsed;
    initialCooldown = remaining > 0 ? remaining : 0;
  }

  return <CheckEmailForm email={email} initialCooldown={initialCooldown} />;
}