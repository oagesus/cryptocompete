"use client";

import { Card, CardContent } from "@/components/ui/card";

interface UsernameHistoryCardProps {
  username: string;
  changedAt: string;
}

export function UsernameHistoryCard({ username, changedAt }: UsernameHistoryCardProps) {
  const formattedDate = new Date(changedAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 px-4 md:flex-row md:items-center md:justify-between">
        <span className="font-medium">{username}</span>
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </CardContent>
    </Card>
  );
}