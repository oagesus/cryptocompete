import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set Password",
  description: "Set a password for your CryptoCompete account.",
};

export default async function SetPasswordPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return <SetPasswordForm />;
}