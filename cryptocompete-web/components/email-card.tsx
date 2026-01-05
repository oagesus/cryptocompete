"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmailCardProps {
  email: string;
}

export function EmailCard({ email }: EmailCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Email</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{email}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/change-email">Change</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}