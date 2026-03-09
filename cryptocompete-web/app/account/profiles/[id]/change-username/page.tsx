import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Change Username",
  description: "Change your CryptoCompete profile username.",
};
import { getUser } from "@/lib/auth/get-user";
import { ChangeUsernameForm } from "./change-username-form";

const API_URL = process.env.API_URL;

interface UsernameHistoryEntry {
  username: string;
  changedAt: string;
}

interface UsernameHistoryResponse {
  currentUsername: string;
  isInitialUsername: boolean;
  usernameChangedAt: string | null;
  history: UsernameHistoryEntry[];
}

async function getUsetnameHistory(publicId: string): Promise<UsernameHistoryResponse | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/profiles/${publicId}/username-history`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function ChangeUsernamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const { id: publicId } = await params;

  if (!user) {
    redirect("/auth/clear");
  }

  const profile = user.profiles.find((p) => p.publicId === publicId);

  if (!profile) {
    redirect("/account/settings");
  }

  const historyData = await getUsetnameHistory(publicId);

  return (
    <ChangeUsernameForm
      profile={profile}
      initialHistory={historyData}
    />
  );
}