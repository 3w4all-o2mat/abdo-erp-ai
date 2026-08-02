"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProductTypeMoteur } from "@/lib/actions/product-types-moteur";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ProductTypeMoteurFormDialog } from "@/components/admin/product-type-moteur-form";
import type { ProductTypeMoteur } from "@prisma/client";

export function ProductTypeMoteurActions({
  type,
}: {
  type: Pick<ProductTypeMoteur, "id" | "name" | "isActive">;
}) {
  const blocked = false;

  return (
    <div className="flex items-center justify-center gap-1">
      <ProductTypeMoteurFormDialog
        type={type as ProductTypeMoteur}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier le type de moteur">
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
          title="Suppression impossible"
        >
          <Lock className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <ConfirmDialog
          title="Supprimer ce type de moteur ?"
          description="Cette action est définitive. Aucun moteur n'est lié à ce type."
          onConfirm={() => deleteProductTypeMoteur(type.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer le type de moteur">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
