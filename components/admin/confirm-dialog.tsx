"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  trigger, title, description, confirmLabel = "Confirmer", cancelLabel = "Annuler",
  variant = "destructive", onConfirm, children,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default" | "success";
  onConfirm: () => Promise<void> | void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  const hasError = error !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setError(null); setOpen(o); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {children && <span onClick={() => setOpen(true)}>{children}</span>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && !hasError && <DialogDescription>{description}</DialogDescription>}
          {error && <DialogDescription className="text-destructive font-medium">{error}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={loading}>{hasError ? "Fermer" : cancelLabel}</Button></DialogClose>
          {!hasError && <Button variant={variant} onClick={handle} disabled={loading}>{loading ? "..." : confirmLabel}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}