"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tApi = useTranslations("api");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const registerSchema = z
    .object({
      username: z
        .string()
        .min(3, t("usernameMinLength"))
        .max(20, t("usernameMaxLength"))
        .regex(
          /^[a-zA-Z0-9_]+$/,
          t("usernameInvalidChars")
        ),
      email: z.string().email(t("emailInvalid")),
      password: z
        .string()
        .min(8, t("passwordMinLength"))
        .regex(/[A-Z]/, t("passwordUppercase"))
        .regex(/[a-z]/, t("passwordLowercase"))
        .regex(/[0-9]/, t("passwordNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message?.includes("already registered") || errorData.message?.includes("already exists")) {
          throw new Error(tApi("errors.emailAlreadyRegistered"));
        }
        if (errorData.message?.includes("already taken")) {
          throw new Error(tApi("errors.usernameAlreadyTaken"));
        }
        if (errorData.message?.includes("wait") && errorData.message?.includes("seconds")) {
          const match = errorData.message.match(/(\d+)\s*seconds/);
          const seconds = match ? match[1] : "60";
          throw new Error(tApi("errors.pleaseWaitSeconds", { seconds }));
        }
        throw new Error(tApi("errors.generic"));
      }

      const maxAge = 60 * 60 * 24;
      document.cookie = `pendingVerificationEmail=${encodeURIComponent(data.email)}; path=/; max-age=${maxAge}; samesite=lax`;
      document.cookie = `verificationLastSentAt=${Date.now()}; path=/; max-age=60; samesite=lax`;
      router.push("/auth/check-email");
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
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("username")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your_username"
                      autoComplete="username"
                      disabled={isLoading || isGoogleLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isLoading || isGoogleLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isLoading || isGoogleLoading}
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
        />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            {t("login")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}