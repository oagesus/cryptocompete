import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

export default async function CreateProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = (await getUser())!;

  const isPremium = user.roles.includes("Premium") || user.roles.includes("Admin");

  if (!isPremium) {
    const activeProfile = user.profiles.find(p => p.publicId === user.activeProfileId);
    if (activeProfile) {
      redirect(`/account/profiles/${activeProfile.publicId}`);
    }
    redirect("/account/settings");
  }

  const maxProfiles = 5;
  if (user.profiles.length >= maxProfiles) {
    const activeProfile = user.profiles.find(p => p.publicId === user.activeProfileId);
    if (activeProfile) {
      redirect(`/account/profiles/${activeProfile.publicId}`);
    }
    redirect("/account/settings");
  }

  return <>{children}</>;
}