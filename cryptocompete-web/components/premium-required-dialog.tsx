"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumRequiredDialog({ open, onOpenChange }: PremiumRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Premium Required</DialogTitle>
          <DialogDescription>
            Premium subscription required to create additional profiles.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}