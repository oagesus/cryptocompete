"use client";

import { useEffect } from "react";

export function TimezoneGuardian() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `timezone=${timezone}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}