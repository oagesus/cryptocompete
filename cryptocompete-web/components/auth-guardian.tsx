"use client";

import { useEffect, useRef } from "react";

function getTokenExpiration(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )token_exp=([^;]*)/);
  if (!match) return null;
  const exp = parseInt(match[1], 10);
  return isNaN(exp) ? null : exp * 1000;
}

export function AuthGuardian() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleRefresh() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const exp = getTokenExpiration();
      if (!exp) return;

      const timeUntilRefresh = exp - Date.now() - 30000;
      if (timeUntilRefresh <= 0) {
        doRefresh();
        return;
      }

      timeoutRef.current = setTimeout(doRefresh, timeUntilRefresh);
    }

    async function doRefresh() {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (response.ok) {
          scheduleRefresh();
        }
      } catch {
        // Ignore errors
      }
    }

    scheduleRefresh();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}