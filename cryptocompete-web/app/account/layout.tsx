import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { AccountLayoutClient } from "./account-layout-client";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return (
    <AccountLayoutClient initialData={user}>
      {children}
    </AccountLayoutClient>
  );
}