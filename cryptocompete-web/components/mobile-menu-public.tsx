"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleIcon } from "@/components/theme-toggle-icon";

export function MobileMenuPublic() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
        <DropdownMenuItem
          onClick={() => router.push("/trade/buy")}
          className="cursor-pointer"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Trade
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center">
          <div
            onClick={() => router.push("/auth/login")}
            className="flex flex-1 items-center justify-center py-1.5 rounded-sm cursor-pointer hover:bg-accent active:bg-accent"
          >
            <span className="text-sm">Sign In</span>
          </div>
          <div
            onClick={() => router.push("/auth/register")}
            className="flex flex-1 items-center justify-center py-1.5 rounded-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90"
          >
            <span className="text-sm">Sign Up</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-center">
          <ThemeToggleIcon />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}