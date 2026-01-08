"use client";

import { useState } from "react";
import { toast } from "sonner";

import { GoogleLinkButton } from "@/components/google-link-button";
import { Card, CardContent } from "@/components/ui/card";

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

interface GoogleConnectionCardProps {
  isConnected: boolean;
  hasPassword: boolean;
  onConnectionChange: () => void;
}

export function GoogleConnectionCard({
  isConnected,
  hasPassword,
  onConnectionChange,
}: GoogleConnectionCardProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSuccess() {
    setError(null);
    onConnectionChange();
  }

  function handleError(errorMessage: string) {
    setError(errorMessage);
  }

  async function handleDisconnect() {
    try {
      const res = await fetch("/api/auth/google/unlink", {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to disconnect Google account");
      }

      const data = await res.json();
      toast.success(data.message);
      onConnectionChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        <Card
          onClick={handleDisconnect}
          className="group cursor-pointer transition-colors border-green-500/50 bg-green-50/50 dark:bg-green-950/20 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/20"
        >
          <CardContent className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <GoogleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Google</span>
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400 group-hover:text-red-600 dark:group-hover:text-red-400">
              <span className="group-hover:hidden">Connected</span>
              <span className="hidden group-hover:inline">Disconnect</span>
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      <GoogleLinkButton onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}