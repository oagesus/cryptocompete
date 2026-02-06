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

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: (data: { activeUntil?: string }) => void;
  translations: Record<string, string>;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onCancelled,
  translations: t,
}: CancelSubscriptionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || t.cancelError);
        return;
      }

      const data = await res.json();
      onCancelled(data);
      onOpenChange(false);
      toast.success(t.cancelSuccess);
      router.refresh();
    } catch {
      toast.error(t.cancelError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.cancelConfirmTitle}</DialogTitle>
          <DialogDescription>
            {t.cancelConfirmLine1} {t.cancelConfirmLine2}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t.cancelKeepButton}
          </Button>
          <Button onClick={handleCancel} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.cancelling}
              </>
            ) : (
              t.cancelConfirmButton
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}