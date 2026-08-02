"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProductMarqueFiltre } from "@/lib/actions/product-marques-filtre";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ProductMarqueFiltreFormDialog } from "@/components/admin/product-marque-filtre-form";
import type { ProductMarqueFiltre } from "@prisma/client";

export function ProductMarqueFiltreActions({
  marque, productsCount = 0,
}: {
  marque: Pick<ProductMarqueFiltre, "id" | "name" | "isActive">;
  productsCount?: number;
}) {
  const blocked = productsCount > 0;
  const blockMessage = `Impossible de supprimer : ${productsCount} produit(s) lié(s). Réassignez ces produits d'abord.`;

  return (
    <div className="flex items-center justify-center gap-1">
      <ProductMarqueFiltreFormDialog
        marque={marque as ProductMarqueFiltre}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier la marque de filtre">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        }
      />
      {blocked ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          disabled
          aria-label="Suppression impossible"
          title={blockMessage}
        >
          <Lock className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <ConfirmDialog
          title="Supprimer cette marque de filtre ?"
          description="Cette action est définitive. Aucun produit n'est lié à cette marque."
          onConfirm={() => deleteProductMarqueFiltre(marque.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer la marque de filtre">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
