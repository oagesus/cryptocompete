"use client";

import { Card, CardContent } from "@/components/ui/card";

interface EmailCardProps {
  email: string;
}

export function EmailCard({ email }: EmailCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Email</span>
        <span className="text-sm font-medium">{email}</span>
      </CardContent>
    </Card>
  );
}