"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const router = useRouter();

  function handleSignUp() {
    onOpenChange(false);
    router.push("/auth/register");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Required</DialogTitle>
          <DialogDescription>
            You need an account to start trading.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSignUp}>
            Sign Up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}