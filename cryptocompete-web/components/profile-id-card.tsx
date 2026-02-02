"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Hash, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileIdCardProps {
  publicId: string;
}

export function ProfileIdCard({ publicId }: ProfileIdCardProps) {
  const t = useTranslations("account");
  const [isVisible, setIsVisible] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicId);
      toast.success(t("profileIdCopied"));
    } catch {
      toast.error(t("failedToCopyProfileId"));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("profileId")}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <span
              onClick={() => !isVisible && setIsVisible(true)}
              className={`text-sm font-medium font-mono ${
                !isVisible ? "blur-sm select-none cursor-pointer" : ""
              }`}
            >
              {publicId}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full md:w-auto"
            onClick={handleCopy}
          >
            {t("copy")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}