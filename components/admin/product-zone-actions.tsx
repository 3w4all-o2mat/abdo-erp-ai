"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProductZone } from "@/lib/actions/product-zones";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ProductZoneFormDialog } from "@/components/admin/product-zone-form";
import type { ProductZone } from "@prisma/client";

export function ProductZoneActions({
  zone, marquesCount = 0,
}: {
  zone: Pick<ProductZone, "id" | "name" | "isActive">;
  marquesCount?: number;
}) {
  const blocked = marquesCount > 0;
  const blockMessage = `Impossible de supprimer : ${marquesCount} marque(s) maison liée(s). Déplacez ou supprimez ces marques d'abord.`;

  return (
    <div className="flex items-center justify-center gap-1">
      <ProductZoneFormDialog
        zone={zone as ProductZone}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier la zone">
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
          title="Supprimer cette zone ?"
          description="Cette action est définitive. Aucune marque maison n'est liée à cette zone."
          onConfirm={() => deleteProductZone(zone.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer la zone">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
