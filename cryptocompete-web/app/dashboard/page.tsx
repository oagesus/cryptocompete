import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/clear");
  }

  const activeProfile = user.profiles.find((p) => p.publicId === user.activeProfileId)!;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {activeProfile.username}</p>
    </div>
  );
}