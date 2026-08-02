"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteRecord } from "@/lib/actions";
import { Pencil, Trash2 } from "lucide-react";
import { StockFormDialog } from "@/components/admin/stock-form";

export function StockActions({ stock }: { stock: { id: string; name: string; address: string | null; isDefault: boolean } }) {
  return (
    <div className="flex gap-1">
      <StockFormDialog stock={stock} trigger={<Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /> Modifier</Button>} />
      <ConfirmDialog title="Supprimer ce stock ?" description="Les mouvements historiques seront conservés." onConfirm={() => deleteRecord("stocks", stock.id, "stocks.manage")}>
        <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </ConfirmDialog>
    </div>
  );
}
