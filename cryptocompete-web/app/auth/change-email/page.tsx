import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { ChangeEmailForm } from "./change-email-form";

export default async function ChangeEmailPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return <ChangeEmailForm />;
}