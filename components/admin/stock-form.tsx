"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createStock, updateStock } from "@/lib/actions/stocks";
import type { Stock } from "@prisma/client";

export function StockFormDialog({ trigger, stock }: { trigger?: React.ReactNode; stock?: { id?: string; name?: string; address?: string | null; isDefault?: boolean } }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name")), address: String(fd.get("address") || ""), isDefault: fd.get("isDefault") === "on" };
    try {
      if (stock?.id) await updateStock(stock.id, data);
      else await createStock(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{stock ? "Modifier le stock" : "Nouveau stock"}</DialogTitle>
          <DialogDescription>{stock ? "Mettez à jour les informations." : "Ajoutez un nouvel entrepôt."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Nom *</Label><Input id="name" name="name" defaultValue={stock?.name} required /></div>
          <div className="space-y-2"><Label htmlFor="address">Adresse</Label><Input id="address" name="address" defaultValue={stock?.address ?? ""} /></div>
          <div className="flex items-center gap-2"><Switch id="isDefault" name="isDefault" defaultChecked={stock?.isDefault ?? false} /><Label htmlFor="isDefault">Stock par défaut</Label></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}