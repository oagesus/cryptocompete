"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface SubscriptionToastHandlerProps {
  translations: {
    subscriptionCancelled: string;
    activationFailed: string;
    proActive: string;
    activationError: string;
  };
}

export function SubscriptionToastHandler({ translations: t }: SubscriptionToastHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const subscriptionParam = searchParams.get("subscription");
    const subscriptionId = searchParams.get("subscription_id");

    if (!subscriptionParam) return;
    handled.current = true;

    const url = new URL(window.location.href);
    url.searchParams.delete("subscription");
    url.searchParams.delete("subscription_id");
    url.searchParams.delete("ba_token");
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.pathname + (url.search || ""));

    if (subscriptionParam === "success" && subscriptionId) {
      activateSubscription(subscriptionId);
    } else if (subscriptionParam === "cancelled") {
      if (subscriptionId) {
        fetch("/api/subscription/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ subscriptionId }),
        }).catch(() => {});
      }
      toast.info(t.subscriptionCancelled);
    }

    async function activateSubscription(subId: string) {
      try {
        const res = await fetch("/api/subscription/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ subscriptionId: subId }),
        });

        if (!res.ok) {
          toast.error(t.activationFailed);
          return;
        }

        toast.success(t.proActive, {
          className: "!bg-green-600 !text-white",
        });
        router.refresh();
      } catch {
        toast.error(t.activationError);
      }
    }
  }, [searchParams, router, t]);

  return null;
}