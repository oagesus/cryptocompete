import { cookies } from "next/headers";

const API_URL = process.env.API_URL;

export interface Profile {
  publicId: string;
  username: string;
  isMain: boolean;
}

export interface User {
  id: number;
  email: string;
  hasPassword: boolean;
  connectedProviders: string[];
  profiles: Profile[];
  activeProfileId: string | null;
  roles: string[];
  maxProfiles: number;
}

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
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