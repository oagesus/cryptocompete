"use client";

import { useEffect, useRef } from "react";

const MAX_TIMEOUT = 2_147_483_647;

function getSubscriptionExpiration(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )subscription_exp=([^;]*)/);
  if (!match) return null;
  const exp = parseInt(match[1], 10);
  return isNaN(exp) ? null : exp * 1000;
}

export function SubscriptionGuardian() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlingRef = useRef(false);

  useEffect(() => {
    function schedule() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const exp = getSubscriptionExpiration();
      if (!exp) return;

      const timeUntilExpiry = exp - Date.now();
      if (timeUntilExpiry <= 0) {
        handleExpiry();
        return;
      }

      if (timeUntilExpiry > MAX_TIMEOUT) {
        timeoutRef.current = setTimeout(schedule, MAX_TIMEOUT);
        return;
      }

      timeoutRef.current = setTimeout(handleExpiry, timeUntilExpiry);
    }

    async function handleExpiry() {
      if (handlingRef.current) return;
      handlingRef.current = true;

      try {
        await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }

      window.location.reload();
    }

    schedule();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}