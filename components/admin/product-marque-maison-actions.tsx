"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProductMarqueMaison } from "@/lib/actions/product-marques-maison";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ProductMarqueMaisonFormDialog } from "@/components/admin/product-marque-maison-form";
import type { ProductMarqueMaison, ProductZone } from "@prisma/client";

export function ProductMarqueMaisonActions({
  marque, zones, productsCount = 0,
}: {
  marque: Pick<ProductMarqueMaison, "id" | "name" | "zoneId" | "isActive">;
  zones: ProductZone[];
  productsCount?: number;
}) {
  const blocked = productsCount > 0;
  const blockMessage = `Impossible de supprimer : ${productsCount} produit(s) lié(s). Retirez cette marque des produits concernés d'abord.`;

  return (
    <div className="flex items-center justify-center gap-1">
      <ProductMarqueMaisonFormDialog
        marque={marque as ProductMarqueMaison}
        zones={zones}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier la marque maison">
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
          title="Supprimer cette marque maison ?"
          description="Cette action est définitive. Aucun produit n'est lié à cette marque."
          onConfirm={() => deleteProductMarqueMaison(marque.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer la marque maison">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
