"use client";

import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UsernameCardProps {
  username: string;
}

export function UsernameCard({ username }: UsernameCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Username</span>
        </div>
        <span className="text-sm font-medium">{username}</span>
      </CardContent>
    </Card>
  );
}