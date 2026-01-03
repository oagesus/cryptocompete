"use client";

import { Card, CardContent } from "@/components/ui/card";

interface UsernameCardProps {
  username: string;
}

export function UsernameCard({ username }: UsernameCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Username</span>
        <span className="text-sm font-medium">{username}</span>
      </CardContent>
    </Card>
  );
}