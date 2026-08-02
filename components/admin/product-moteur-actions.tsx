"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProductMoteur } from "@/lib/actions/product-moteurs";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ProductMoteurFormDialog } from "@/components/admin/product-moteur-form";
import type { ProductMoteur } from "@prisma/client";

export function ProductMoteurActions({
  moteur, productsCount = 0,
}: {
  moteur: Pick<ProductMoteur, "id" | "name" | "isActive">;
  productsCount?: number;
}) {
  const blocked = productsCount > 0;
  const blockMessage = `Impossible de supprimer : ${productsCount} produit(s) lié(s). Réassignez ces produits d'abord.`;

  return (
    <div className="flex items-center justify-center gap-1">
      <ProductMoteurFormDialog
        moteur={moteur as ProductMoteur}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier le moteur">
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
          title="Supprimer ce moteur ?"
          description="Cette action est définitive. Aucun produit n'est lié à ce moteur."
          onConfirm={() => deleteProductMoteur(moteur.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer le moteur">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
