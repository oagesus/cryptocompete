"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResubscribed: () => void;
  translations: Record<string, string>;
}

export function ResubscribeDialog({
  open,
  onOpenChange,
  onResubscribed,
  translations: t,
}: ResubscribeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleResubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/resubscribe", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || t.resubscribeError);
        return;
      }

      onResubscribed();
      onOpenChange(false);
      document.cookie = "subscription_exp=; path=/; max-age=0";
      toast.success(t.resubscribeSuccess, {
        className: "!bg-green-600 !text-white",
      });
      router.refresh();
    } catch {
      toast.error(t.resubscribeError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.resubscribeConfirmTitle}</DialogTitle>
          <DialogDescription>
            {t.resubscribeConfirmDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t.resubscribeCancelButton}
          </Button>
          <Button onClick={handleResubscribe} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.resubscribing}
              </>
            ) : (
              t.resubscribeConfirmButton
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}