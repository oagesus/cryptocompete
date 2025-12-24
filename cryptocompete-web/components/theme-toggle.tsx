"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle() {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
  }

  const isDark = mounted ? resolvedTheme === "dark" : undefined;

  return (
    <>
      <style>{`
        .theme-toggle-icon {
          transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)  !important;
        }
      `}</style>
      <Button variant="ghost" size="icon" onClick={handleToggle}>
        <div className="relative h-[1.2rem] w-[1.2rem]">
          <Sun
            className={`theme-toggle-icon absolute top-1/2 left-1/2 h-[1.2rem] w-[1.2rem] ${
              isDark === undefined ? "dark:opacity-0 dark:-rotate-90" : ""
            }`}
            style={isDark !== undefined ? {
              transform: isDark 
                ? "translate(-50%, -50%) rotate(-90deg)" 
                : "translate(-50%, -50%) rotate(0deg)",
              opacity: isDark ? 0 : 1,
            } : {
              transform: "translate(-50%, -50%)",
            }}
          />
          <Moon
            className={`theme-toggle-icon absolute top-1/2 left-1/2 h-[1.2rem] w-[1.2rem] ${
              isDark === undefined ? "opacity-0 rotate-90 dark:opacity-100 dark:rotate-0" : ""
            }`}
            style={isDark !== undefined ? {
              transform: isDark 
                ? "translate(-50%, -50%) rotate(0deg)" 
                : "translate(-50%, -50%) rotate(90deg)",
              opacity: isDark ? 1 : 0,
            } : {
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </>
  );
}