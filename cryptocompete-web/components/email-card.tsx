"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmailCardProps {
  email: string;
}

export function EmailCard({ email }: EmailCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Email</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <span className="text-sm font-medium">{email}</span>
          <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
            <Link href="/auth/change-email">Change</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}