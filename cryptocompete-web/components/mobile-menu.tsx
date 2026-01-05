"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Settings, User, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleIcon } from "@/components/theme-toggle-icon";
import { User as UserType } from "@/lib/auth/get-user";

interface MobileMenuProps {
  user: UserType;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const activeProfile = user.profiles.find((p) => p.publicId === user.activeProfileId)!;

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <div className="relative h-5 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "top-[9px] rotate-45" : "top-1"
              }`}
            />
            <span
              className={`absolute left-0 top-[9px] block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                isOpen ? "top-[9px] -rotate-45" : "top-[14px]"
              }`}
            />
          </div>
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{activeProfile.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(`/account/profiles/${activeProfile.publicId}`)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Profiles
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/account/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4 text-destructive" />
          Sign Out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggleIcon />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}