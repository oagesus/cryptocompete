"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("auth.verifyEmailChange");
  const tApi = useTranslations("api");
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("noToken"));
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
          setMessage(tApi("success.emailChanged"));
        } else {
          setStatus("error");
          if (data.message?.includes("Invalid")) {
            setMessage(tApi("errors.invalidVerificationToken"));
          } else if (data.message?.includes("already been used")) {
            setMessage(tApi("errors.tokenAlreadyUsed"));
          } else if (data.message?.includes("expired")) {
            setMessage(tApi("errors.tokenExpired"));
          } else if (data.message?.includes("already in use")) {
            setMessage(tApi("errors.emailAlreadyInUse"));
          } else {
            setMessage(tApi("errors.generic"));
          }
        }
      } catch {
        setStatus("error");
        setMessage(tApi("errors.generic"));
      }
    }

    verifyEmailChange();
  }, [token, t, tApi]);

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {status === "loading" && t("verifying")}
          {status === "success" && t("success")}
          {status === "error" && t("error")}
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
            {t("backToSettings")}
          </Button>
        )}
        {status === "error" && (
          <Button asChild>
            <Link href="/auth/change-email">{t("tryAgain")}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function VerifyEmailChangeFallback() {
  const t = useTranslations("auth.verifyEmailChange");

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {t("verifying")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense fallback={<VerifyEmailChangeFallback />}>
      <VerifyEmailChangeContent />
    </Suspense>
  );
}