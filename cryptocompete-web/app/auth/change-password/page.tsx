import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return <ChangePasswordForm />;
}