"use client";

import { useEffect, useState } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type VerificationStatus = "loading" | "success" | "error";

export default function VerifyPage() {
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

    async function verifyEmail() {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/verify?token=${token}`
        );
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email address..."}
          {status === "success" && "Your email has been verified"}
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
          <Button asChild>
            <Link href="/auth/login">Continue to Login</Link>
          </Button>
        )}
        {status === "error" && (
          <Button variant="outline" asChild>
            <Link href="/auth/register">Back to Registration</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}