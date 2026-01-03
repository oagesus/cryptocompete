"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              type?: string;
            }
          ) => void;
        };
      };
    };
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface GoogleLinkButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleLinkButton({ onSuccess, onError }: GoogleLinkButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);

      try {
        const res = await fetch("/api/auth/google/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            idToken: response.credential,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to link Google account");
        }

        onSuccess?.();
        router.refresh();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [router, onSuccess, onError]
  );

  useEffect(() => {
    if (window.google) {
      setGoogleReady(true);
    }
  }, []);

  useEffect(() => {
    if (!googleReady || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleCallback,
    });

    const hiddenButton = document.getElementById("google-link-hidden-button");
    if (hiddenButton) {
      hiddenButton.innerHTML = "";
      window.google.accounts.id.renderButton(hiddenButton, {
        type: "icon",
        size: "large",
      });
    }
  }, [googleReady, handleGoogleCallback]);

  function handleGoogleClick() {
    const hiddenButton = document.getElementById("google-link-hidden-button");
    const googleButton = hiddenButton?.querySelector(
      'div[role="button"]'
    ) as HTMLElement;
    googleButton?.click();
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleReady(true)}
      />
      <div id="google-link-hidden-button" className="hidden" />
      <Card
        onClick={handleGoogleClick}
        className={`cursor-pointer transition-colors hover:bg-muted ${
          isLoading || !googleReady ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <CardContent className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Google</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Connect
          </span>
        </CardContent>
      </Card>
    </>
  );
}