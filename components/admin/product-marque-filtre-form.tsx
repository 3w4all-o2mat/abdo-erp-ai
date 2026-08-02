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
import { createProductMarqueFiltre, updateProductMarqueFiltre } from "@/lib/actions/product-marques-filtre";
import type { ProductMarqueFiltre } from "@prisma/client";

export function ProductMarqueFiltreFormDialog({
  trigger, marque,
}: {
  trigger?: React.ReactNode;
  marque?: ProductMarqueFiltre;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isActive, setIsActive] = React.useState(marque?.isActive ?? true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name") ?? ""), isActive };
    try {
      if (marque) await updateProductMarqueFiltre(marque.id, data);
      else await createProductMarqueFiltre(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{marque ? "Modifier la marque de filtre" : "Nouvelle marque de filtre"}</DialogTitle>
          <DialogDescription>
            {marque ? "Mettez à jour les informations de la marque." : "Ajoutez une nouvelle marque de filtre."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" defaultValue={marque?.name} required autoFocus />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Actif</Label>
              <p className="text-xs text-muted-foreground">
                Les marques inactives sont masquées des formulaires de saisie.
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
