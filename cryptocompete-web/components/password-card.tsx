"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PasswordCardProps {
  hasPassword: boolean;
}

export function PasswordCard({ hasPassword }: PasswordCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Password</span>
        </div>
        <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
          <Link href={hasPassword ? "/auth/change-password" : "/auth/set-password"}>
            {hasPassword ? "Change" : "Set Password"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}