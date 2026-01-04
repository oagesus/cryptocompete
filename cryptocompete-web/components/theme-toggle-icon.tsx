"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggleIcon() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleThemeToggle(e: React.MouseEvent) {
    e.preventDefault();
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
  }

  const isDark = mounted ? resolvedTheme === "dark" : undefined;

  return (
    <>
      <style>{`
        .theme-toggle-icon {
          transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease !important;
        }
      `}</style>
      <div
        onClick={handleThemeToggle}
        className="flex justify-center py-2 rounded-sm cursor-pointer hover:bg-accent active:bg-accent"
      >
        <div className="relative h-5 w-5">
          <Sun
            className={`theme-toggle-icon absolute h-5 w-5 ${
              isDark === undefined ? "dark:opacity-0 dark:-rotate-90" : ""
            }`}
            style={
              isDark !== undefined
                ? {
                    transform: isDark ? "rotate(-90deg)" : "rotate(0deg)",
                    opacity: isDark ? 0 : 1,
                  }
                : undefined
            }
          />
          <Moon
            className={`theme-toggle-icon absolute h-5 w-5 ${
              isDark === undefined ? "opacity-0 rotate-90 dark:opacity-100 dark:rotate-0" : ""
            }`}
            style={
              isDark !== undefined
                ? {
                    transform: isDark ? "rotate(0deg)" : "rotate(90deg)",
                    opacity: isDark ? 1 : 0,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}