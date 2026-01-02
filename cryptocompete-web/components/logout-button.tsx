"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Sign Out
    </Button>
  );
}