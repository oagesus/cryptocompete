import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { ChangeEmailForm } from "./change-email-form";

export const metadata: Metadata = {
  title: "Change Email",
  description: "Update the email address associated with your CryptoCompete account.",
};

export default async function ChangeEmailPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return <ChangeEmailForm />;
}