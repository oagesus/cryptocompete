"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAccount } from "@/components/account-provider";
import { isPremium } from "@/lib/auth/user-utils";
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

const createProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    ),
});

type CreateProfileFormValues = z.infer<typeof createProfileSchema>;

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, refetch } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const justCreated = useRef(false);

  const userIsPremium = isPremium(user);
  const canAddProfile = user.profiles.length < user.maxProfiles;

  useEffect(() => {
    if (justCreated.current) return;

    if (!userIsPremium || !canAddProfile) {
      const activeProfile = user.profiles.find(p => p.publicId === user.activeProfileId);
      if (activeProfile) {
        router.replace(`/account/profiles/${activeProfile.publicId}`);
      } else if (user.profiles.length > 0) {
        router.replace(`/account/profiles/${user.profiles[0].publicId}`);
      } else {
        router.replace("/account/settings");
      }
    }
  }, [userIsPremium, canAddProfile, user, router]);

  const form = useForm<CreateProfileFormValues>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      username: "",
    },
  });

  async function onSubmit(data: CreateProfileFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
        }),
      });

      if (response.status === 403) {
        setError("Premium subscription required to create additional profiles");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create profile");
      }

      const profile = await response.json();
      justCreated.current = true;
      await refetch();
      toast.success("Profile created successfully");
      router.push(`/account/profiles/${profile.publicId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (!userIsPremium || !canAddProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Create Profile</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Username</h3>
          <p className="text-sm text-muted-foreground">
            Enter a username to create your profile
          </p>
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
                          placeholder="your_username"
                          autoComplete="off"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Profile
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
  );
}