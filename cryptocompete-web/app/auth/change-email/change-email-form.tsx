"use client";

import { useState } from "react";
import Link from "next/link";
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

const changeEmailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

export function ChangeEmailForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  async function onSubmit(data: ChangeEmailFormValues) {
    setIsLoading(true);
    setError(null);

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
        throw new Error(errorData.message || "Failed to send verification email");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to your new email address. Click the link to confirm the change.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link
            href="/account/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to settings
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Change email</CardTitle>
        <CardDescription>
          Enter your new email address and we'll send you a verification link
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
                  <FormLabel>New Email</FormLabel>
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
              Change email
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/account/settings"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to settings
        </Link>
      </CardFooter>
    </Card>
  );
}