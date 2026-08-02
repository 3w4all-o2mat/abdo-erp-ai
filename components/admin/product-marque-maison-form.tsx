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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createProductMarqueMaison, updateProductMarqueMaison } from "@/lib/actions/product-marques-maison";
import type { ProductMarqueMaison, ProductZone } from "@prisma/client";

const NONE_VALUE = "__none__";

export function ProductMarqueMaisonFormDialog({
  trigger, marque, zones,
}: {
  trigger?: React.ReactNode;
  marque?: ProductMarqueMaison;
  zones: ProductZone[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [zoneId, setZoneId] = React.useState<string | null>(marque?.zoneId ?? null);
  const [isActive, setIsActive] = React.useState(marque?.isActive ?? true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name") ?? ""), zoneId, isActive };
    try {
      if (marque) await updateProductMarqueMaison(marque.id, data);
      else await createProductMarqueMaison(data);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const availableZones = zones.filter((z) => z.isActive || z.id === marque?.zoneId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{marque ? "Modifier la marque maison" : "Nouvelle marque maison"}</DialogTitle>
          <DialogDescription>
            {marque ? "Mettez à jour les informations de la marque." : "Ajoutez une nouvelle marque maison. La zone est optionnelle."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" defaultValue={marque?.name} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Zone</Label>
            <Select
              value={zoneId ?? NONE_VALUE}
              onValueChange={(v) => setZoneId(v === NONE_VALUE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucune zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>— Aucune zone —</SelectItem>
                {availableZones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optionnelle : laissez vide pour les marques non encore rattachées.
            </p>
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
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
