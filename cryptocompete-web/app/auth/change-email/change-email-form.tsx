"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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

export function ChangeEmailForm() {
  const t = useTranslations("auth.changeEmail");
  const tApi = useTranslations("api");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeEmailSchema = z.object({
    newEmail: z.string().email(t("emailInvalid")),
  });

  type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  async function onSubmit(data: ChangeEmailFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newEmail: data.newEmail }),
      });

      if (response.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message?.includes("already in use") || errorData.message?.includes("already registered")) {
          throw new Error(tApi("errors.emailAlreadyInUse"));
        }
        if (errorData.message?.includes("must be different")) {
          throw new Error(tApi("errors.newEmailMustBeDifferent"));
        }
        if (errorData.message?.includes("wait") && errorData.message?.includes("seconds")) {
          const match = errorData.message.match(/(\d+)\s*seconds/);
          const seconds = match ? match[1] : "60";
          throw new Error(tApi("errors.pleaseWaitSeconds", { seconds }));
        }
        throw new Error(tApi("errors.generic"));
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tApi("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("successTitle")}</CardTitle>
          <CardDescription>
            {t("successDescription")}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link
            href="/account/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("backToSettings")}
          </Link>
        </CardFooter>
      </Card>
    );
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
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/account/settings"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("backToSettings")}
        </Link>
      </CardFooter>
    </Card>
  );
}