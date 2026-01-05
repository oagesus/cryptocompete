"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerificationStatus = "loading" | "success" | "error";

function VerifyEmailChangeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    async function verifyEmailChange() {
      try {
        const response = await fetch(
          `/api/auth/verify-email-change?token=${token}`
        );
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email changed successfully");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    }

    verifyEmailChange();
  }, [token]);

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Email Change</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your new email address..."}
          {status === "success" && "Your email has been changed"}
          {status === "error" && "Verification failed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && (
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        )}
        {status === "success" && (
          <CheckCircle className="h-16 w-16 text-green-500" />
        )}
        {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {status === "success" && (
          <Button onClick={() => window.location.href = "/account/settings"}>
            Back to Settings
          </Button>
        )}
        {status === "error" && (
          <Button variant="outline" asChild>
            <Link href="/auth/change-email">Try Again</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Email Change</CardTitle>
            <CardDescription>
              Verifying your new email address...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailChangeContent />
    </Suspense>
  );
}