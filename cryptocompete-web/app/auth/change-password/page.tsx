import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Change your CryptoCompete account password.",
};

export default async function ChangePasswordPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return <ChangePasswordForm />;
}