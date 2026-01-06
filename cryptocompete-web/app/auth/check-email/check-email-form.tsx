"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RESEND_COOLDOWN = 60;
const COOKIE_NAME_LAST_SENT = "verificationLastSentAt";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

interface CheckEmailFormProps {
  email: string;
  initialCooldown: number;
}

export function CheckEmailForm({ email, initialCooldown }: CheckEmailFormProps) {
  const [resendCooldown, setResendCooldown] = useState(initialCooldown);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setResendError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.secondsRemaining) {
          const correctedTimestamp = Date.now() - (RESEND_COOLDOWN - data.secondsRemaining) * 1000;
          setCookie(COOKIE_NAME_LAST_SENT, correctedTimestamp.toString(), RESEND_COOLDOWN);
          setResendCooldown(data.secondsRemaining);
        }
        throw new Error(data.message || "Failed to resend verification email");
      }

      setCookie(COOKIE_NAME_LAST_SENT, Date.now().toString(), RESEND_COOLDOWN);
      setResendCooldown(RESEND_COOLDOWN);
      toast.success("Verification email sent");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending]);

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Mail className="h-16 w-16 text-primary" />

        {resendError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md w-full">
            {resendError}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive an email?
        </p>

        <Button
          onClick={handleResendVerification}
          disabled={resendCooldown > 0 || isResending}
        >
          {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend verification email"}
        </Button>
      </CardContent>
    </Card>
  );
}