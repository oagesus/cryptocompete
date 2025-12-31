import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user.username}</p>
    </div>
  );
}