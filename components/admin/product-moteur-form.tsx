"use client";
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createProductMoteur, updateProductMoteur } from "@/lib/actions/product-moteurs";
import type { ProductMoteur } from "@prisma/client";

export function ProductMoteurFormDialog({
  trigger, moteur,
}: {
  trigger?: React.ReactNode;
  moteur?: ProductMoteur;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isActive, setIsActive] = React.useState(moteur?.isActive ?? true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name") ?? ""), isActive };
    try {
      if (moteur) await updateProductMoteur(moteur.id, data);
      else await createProductMoteur(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{moteur ? "Modifier le moteur" : "Nouveau moteur"}</DialogTitle>
          <DialogDescription>
            {moteur ? "Mettez à jour les informations du moteur." : "Ajoutez un nouveau moteur."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" defaultValue={moteur?.name} required autoFocus />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Actif</Label>
              <p className="text-xs text-muted-foreground">
                Les moteurs inactifs sont masqués des formulaires de saisie.
              </p>
            </div>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
