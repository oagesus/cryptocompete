"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useAccount } from "@/components/account-provider";
import { UsernameHistoryCard } from "@/components/username-history-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface UsernameHistoryEntry {
  username: string;
  changedAt: string;
}

interface UsernameHistoryResponse {
  currentUsername: string;
  isInitialUsername: boolean;
  usernameChangedAt: string | null;
  history: UsernameHistoryEntry[];
}

interface Profile {
  publicId: string;
  username: string;
  isMain: boolean;
}

interface ChangeUsernameFormProps {
  profile: Profile;
  initialHistory: UsernameHistoryResponse | null;
}

function getNextChangeDate(history: UsernameHistoryResponse | null): Date | null {
  if (!history || history.history.length === 0) {
    return null;
  }
  const lastChange = new Date(history.history[0].changedAt);
  const nextChange = new Date(lastChange);
  nextChange.setDate(nextChange.getDate() + 30);
  return nextChange;
}

export function ChangeUsernameForm({ profile, initialHistory }: ChangeUsernameFormProps) {
  const router = useRouter();
  const { refetch } = useAccount();
  const t = useTranslations("account");
  const tApi = useTranslations("api");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeUsernameSchema = z.object({
    username: z
      .string()
      .min(3, t("usernameMinLength"))
      .max(20, t("usernameMaxLength"))
      .regex(
        /^[a-zA-Z0-9_]+$/,
        t("usernameInvalidChars")
      ),
  });

  type ChangeUsernameFormValues = z.infer<typeof changeUsernameSchema>;

  const form = useForm<ChangeUsernameFormValues>({
    resolver: zodResolver(changeUsernameSchema),
    defaultValues: {
      username: "",
    },
  });

  function formatDate(date: Date): string {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function onSubmit(data: ChangeUsernameFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/profiles/${profile.publicId}/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === "USERNAME_CHANGE_COOLDOWN" && errorData.nextChangeDate) {
          const date = new Date(errorData.nextChangeDate);
          throw new Error(t("usernameCooldown", { date: formatDate(date) }));
        }
        if (errorData.message?.includes("already taken") || errorData.message?.includes("already exists")) {
          throw new Error(tApi("errors.usernameAlreadyTaken"));
        }
        if (errorData.message?.includes("same as current") || errorData.message?.includes("must be different")) {
          throw new Error(tApi("errors.usernameSameAsCurrent"));
        }
        throw new Error(t("failedToChangeUsername"));
      }

      await refetch();
      toast.success(t("usernameChanged"));
      router.push(`/account/profiles/${profile.publicId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToChangeUsername"));
    } finally {
      setIsLoading(false);
    }
  }

  const nextChangeDate = getNextChangeDate(initialHistory);
  const canChangeNow = !nextChangeDate || nextChangeDate <= new Date();

  const formattedNextChange = nextChangeDate ? formatDate(nextChangeDate) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CardTitle className="text-2xl font-bold">{t("changeUsername")}</CardTitle>
            <div className="flex flex-col text-sm text-muted-foreground md:text-right">
              {formattedNextChange && !canChangeNow ? (
                <span>{t("changeAvailableAt", { date: formattedNextChange })}</span>
              ) : (
                <span>{t("changeAvailable")}</span>
              )}
              <span>{t("usernameChangeInfo")}</span>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("username")}: {profile.username}</h3>
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
                      <div className="flex flex-col gap-3 md:flex-row">
                        <FormControl>
                          <Input
                            placeholder="new_username"
                            autoComplete="off"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                          {t("changeUsername")}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t("previousUsernames")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {initialHistory && initialHistory.history.length > 0 ? (
            <div className="space-y-3">
              {initialHistory.history.map((entry, index) => (
                <UsernameHistoryCard
                  key={index}
                  username={entry.username}
                  changedAt={entry.changedAt}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noPreviousUsernames")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}