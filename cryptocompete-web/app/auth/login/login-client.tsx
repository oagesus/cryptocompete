"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const t = useTranslations("auth.login");
  const tApi = useTranslations("api");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message?.includes("sign in with")) {
          const provider = errorData.message.match(/sign in with (\w+)/)?.[1] || "Google";
          throw new Error(tApi("errors.pleaseSignInWithProvider", { provider }));
        }
        if (errorData.message?.includes("Invalid credentials")) {
          throw new Error(tApi("errors.invalidCredentials"));
        }
        if (errorData.message?.includes("verify your email")) {
          throw new Error(tApi("errors.emailNotVerified"));
        }
        if (errorData.message?.includes("blocked")) {
          throw new Error(tApi("errors.accountBlocked"));
        }
        throw new Error(tApi("errors.generic"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tApi("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {verified && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 rounded-md">
                {t("emailVerified")}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isLoading || isGoogleLoading}
                      tabIndex={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("password")}</FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      tabIndex={4}
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading || isGoogleLoading}
                      tabIndex={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              options={{ appearance: "interaction-only" }}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isGoogleLoading || !turnstileToken}
              tabIndex={3}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submit")}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-muted-foreground">{t("or")}</span>
          </div>
        </div>

        <GoogleSignInButton
          disabled={isLoading || !turnstileToken}
          onError={setError}
          onLoadingChange={setIsGoogleLoading}
          turnstileToken={turnstileToken}
          tabIndex={5}
        />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline"
            tabIndex={6}
          >
            {t("signUp")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginFallback() {
  const t = useTranslations("auth.login");

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}