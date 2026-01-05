"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PasswordCardProps {
  hasPassword: boolean;
}

export function PasswordCard({ hasPassword }: PasswordCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Password</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={hasPassword ? "/auth/change-password" : "/auth/set-password"}>
            {hasPassword ? "Change" : "Set Password"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}