"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { ImageUpload } from "@/components/admin/image-upload";
import type { Product, ProductCategory, ProductPrice } from "@prisma/client";

/** Product shape accepted by the dialog. Prisma `Decimal` fields are pre-converted
 *  to plain `number` on the server (see app/admin/products/[id]/page.tsx) so the
 *  object can be safely serialized to a Client Component. */
type ProductFormProduct = Omit<Product, "costPrice"> & {
  costPrice: number;
};
type ProductFormPrice = Omit<ProductPrice, "unitPrice"> & { unitPrice: number };

const NONE = "__none__";
const CARBURANT_VALUES = ["Essence", "Diesel"] as const;
const AGE_VALUES = ["Ancien", "Nouveau"] as const;
const FILTER_TYPE_VALUES = ["clim", "gazoil", "air", "essence", "huile"] as const;

export function ProductFormDialog({
  trigger, product, categories, currentPrice,
  moteurs = [], marquesFiltres = [], marquesMaisons = [],
  initialMoteurId = null, initialMarqueFiltreId = null, initialMarqueMaisonIds = [],
}: {
  trigger?: React.ReactNode;
  product?: ProductFormProduct;
  categories: ProductCategory[];
  currentPrice?: ProductFormPrice;
  moteurs?: { id: string; name: string }[];
  marquesFiltres?: { id: string; name: string }[];
  marquesMaisons?: { id: string; name: string }[];
  initialMoteurId?: string | null;
  initialMarqueFiltreId?: string | null;
  initialMarqueMaisonIds?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState(product?.productCategoryId ?? categories[0]?.id ?? "");
  const [moteurId, setMoteurId] = React.useState<string>(initialMoteurId ?? "");
  const [marqueFiltreId, setMarqueFiltreId] = React.useState<string>(initialMarqueFiltreId ?? "");
  const [marquesMaisonIds, setMarquesMaisonIds] = React.useState<string[]>(initialMarqueMaisonIds);
  const [carburant, setCarburant] = React.useState<string>(product?.carburant ?? NONE);
  const [age, setAge] = React.useState<string>(product?.age ?? NONE);
  const [filterType, setFilterType] = React.useState<string>(product?.filterType ?? NONE);
  const [imageUrl, setImageUrl] = React.useState<string>(product?.image ?? "");

  const moteurOptions: SearchableOption[] = React.useMemo(
    () => moteurs.map((m) => ({ value: m.id, label: m.name })),
    [moteurs],
  );
  const marqueFiltreOptions: SearchableOption[] = React.useMemo(
    () => marquesFiltres.map((m) => ({ value: m.id, label: m.name })),
    [marquesFiltres],
  );
  const marquesMaisonOptions: MultiSelectOption[] = React.useMemo(
    () => marquesMaisons.map((m) => ({ value: m.id, label: m.name })),
    [marquesMaisons],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      sku: String(fd.get("sku")), barcode: String(fd.get("barcode") || ""),
      name: String(fd.get("name")), displayName: String(fd.get("displayName") || ""),
      productCategoryId: categoryId, unitOfMeasure: String(fd.get("unitOfMeasure") || "pcs"),
      isStockable: fd.get("isStockable") === "on", isActive: fd.get("isActive") === "on",
      costPrice: Number(fd.get("costPrice") || 0),
      unitPrice: Number(fd.get("unitPrice") || 0),
      image: imageUrl || "", description: String(fd.get("description") || ""),
      moteurId: moteurId || null,
      marqueFiltreId: marqueFiltreId || null,
      marquesMaisonIds,
      carburant: carburant === NONE ? null : carburant,
      age: age === NONE ? null : age,
      filterType: filterType === NONE ? null : filterType,
      referenceFilter: String(fd.get("referenceFilter") || ""),
    };
    try {
      if (product) await updateProduct(product.id, data);
      else await createProduct(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription>{product ? "Mettez à jour les informations." : "Ajoutez un nouveau produit."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {/* Identification */}
          <div className="sm:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identification</h3>
          </div>
          <div className="space-y-2"><Label htmlFor="sku">Réf. Originale *</Label><Input id="sku" name="sku" defaultValue={product?.sku} required /></div>
          <div className="space-y-2"><Label htmlFor="barcode">Code-barres</Label><Input id="barcode" name="barcode" defaultValue={product?.barcode ?? ""} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Nom *</Label><Input id="name" name="name" defaultValue={product?.name} required /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="displayName">Nom affiché</Label><Input id="displayName" name="displayName" defaultValue={product?.displayName ?? ""} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="referenceFilter">Réf. filtre</Label><Input id="referenceFilter" name="referenceFilter" defaultValue={product?.referenceFilter ?? ""} /></div>

          {/* Caractéristiques */}
          <div className="sm:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Caractéristiques</h3>
          </div>
          <div className="space-y-2">
            <Label>Carburant</Label>
            <Select value={carburant} onValueChange={setCarburant}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Aucun —</SelectItem>
                {CARBURANT_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Âge</Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Aucun —</SelectItem>
                {AGE_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Type de filtre</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Aucun —</SelectItem>
                {FILTER_TYPE_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Catalogue */}
          <div className="sm:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Catalogue</h3>
          </div>
          <div className="space-y-2">
            <Label>Moteur</Label>
            <SearchableSelect
              value={moteurId}
              onValueChange={setMoteurId}
              options={moteurOptions}
              placeholder="Sélectionner un moteur..."
              emptyMessage="Aucun moteur."
              clearable
            />
          </div>
          <div className="space-y-2">
            <Label>Marque filtre</Label>
            <SearchableSelect
              value={marqueFiltreId}
              onValueChange={setMarqueFiltreId}
              options={marqueFiltreOptions}
              placeholder="Sélectionner une marque..."
              emptyMessage="Aucune marque."
              clearable
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Marques maison</Label>
            <MultiSelect
              value={marquesMaisonIds}
              onValueChange={setMarquesMaisonIds}
              options={marquesMaisonOptions}
              placeholder="Sélectionner une ou plusieurs marques..."
              emptyMessage="Aucune marque maison."
              maxDisplay={2}
            />
          </div>

          {/* Tarification & classification */}
          <div className="sm:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tarification &amp; classification</h3>
          </div>
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="unitOfMeasure">Unité</Label><Input id="unitOfMeasure" name="unitOfMeasure" defaultValue={product?.unitOfMeasure ?? "pcs"} /></div>
          <div className="space-y-2"><Label htmlFor="costPrice">Prix de revient</Label><Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={product?.costPrice ?? 0} /></div>
          <div className="space-y-2"><Label htmlFor="unitPrice">Prix de vente</Label><Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={currentPrice?.unitPrice ?? 0} /></div>
          <div className="flex items-center gap-2"><Switch id="isStockable" name="isStockable" defaultChecked={product?.isStockable ?? true} /><Label htmlFor="isStockable">Stockable</Label></div>
          <div className="flex items-center gap-2"><Switch id="isActive" name="isActive" defaultChecked={product?.isActive ?? true} /><Label htmlFor="isActive">Actif</Label></div>

          {/* Photo & description */}
          <div className="sm:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Photo &amp; description</h3>
          </div>
          <div className="sm:col-span-2">
            <ImageUpload value={imageUrl} onChange={setImageUrl} disabled={loading} />
          </div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={product?.description ?? ""} /></div>

          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}