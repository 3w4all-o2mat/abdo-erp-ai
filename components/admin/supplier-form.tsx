"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import type { Supplier, Wilaya, Commune } from "@prisma/client";

export function SupplierFormDialog({
  trigger, supplier, wilayas,
}: {
  trigger?: React.ReactNode;
  supplier?: Supplier & { wilaya?: Wilaya | null; commune?: Commune | null };
  wilayas: Wilaya[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [wilayaId, setWilayaId] = React.useState<string>(String(supplier?.wilayaId ?? ""));
  const [communes, setCommunes] = React.useState<Commune[]>(supplier?.commune ? [supplier.commune] : []);

  React.useEffect(() => {
    if (!open || !wilayaId) { setCommunes([]); return; }
    fetch(`/api/v1/communes?wilayaId=${wilayaId}`).then((r) => r.json()).then((d) => setCommunes(d.data ?? [])).catch(() => setCommunes([]));
  }, [wilayaId, open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name")), phone: String(fd.get("phone") || ""), email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""), taxId: String(fd.get("taxId") || ""),
      wilayaId: wilayaId ? Number(wilayaId) : null,
      communeId: fd.get("communeId") ? Number(fd.get("communeId")) : null,
      isActive: fd.get("isActive") === "on",
    };
    try {
      if (supplier) await updateSupplier(supplier.id, data);
      else await createSupplier(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
          <DialogDescription>{supplier ? "Mettez à jour les informations." : "Ajoutez un nouveau fournisseur."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Nom *</Label><Input id="name" name="name" defaultValue={supplier?.name} required /></div>
          <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Adresse</Label><Input id="address" name="address" defaultValue={supplier?.address ?? ""} /></div>
          <div className="space-y-2"><Label htmlFor="taxId">NIF / RC</Label><Input id="taxId" name="taxId" defaultValue={supplier?.taxId ?? ""} /></div>
          <div className="space-y-2">
            <Label>Wilaya</Label>
            <Select value={wilayaId} onValueChange={setWilayaId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>{wilayas.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Commune</Label>
            <Select name="communeId" defaultValue={supplier?.communeId ? String(supplier.communeId) : ""}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>{communes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 pt-2">
            <Switch id="isActive" name="isActive" defaultChecked={supplier?.isActive ?? true} />
            <Label htmlFor="isActive">Fournisseur actif</Label>
          </div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}