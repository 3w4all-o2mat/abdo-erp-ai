"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteRecord } from "@/lib/actions";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryFormDialog } from "@/components/admin/category-form";

export function CategoryActions({ category, categories }: { category: { id: string; name: string; parentId: string | null }, categories: { id: string; name: string }[] }) {
  return (
    <div className="mt-2 flex gap-1">
      <CategoryFormDialog category={category as Parameters<typeof CategoryFormDialog>[0]["category"]} categories={categories} trigger={<Button variant="ghost" size="icon-sm"><Pencil className="h-3.5 w-3.5" /></Button>} />
      <ConfirmDialog title="Supprimer cette catégorie ?" description="Les produits liés ne seront pas supprimés." onConfirm={() => deleteRecord("product_categories", category.id, "categories.manage")}>
        <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </ConfirmDialog>
    </div>
  );
}
