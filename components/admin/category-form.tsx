"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { ProductCategory } from "@prisma/client";

export function CategoryFormDialog({
  trigger, category, categories,
}: {
  trigger?: React.ReactNode;
  category?: { id?: string; name?: string; parentId?: string | null };
  categories: { id: string; name: string; parentId?: string | null }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [parentId, setParentId] = React.useState(category?.parentId ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name")), parentId: parentId || null };
    try {
      if (category?.id) await updateCategory(category.id, data);
      else await createCategory(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  const available = categories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          <DialogDescription>{category ? "Mettez à jour la catégorie." : "Ajoutez une nouvelle catégorie de produits."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Nom *</Label><Input id="name" name="name" defaultValue={category?.name} required /></div>
          <div className="space-y-2">
            <Label>Catégorie parente</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Aucune (catégorie racine)" /></SelectTrigger>
              <SelectContent>
                {available.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
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