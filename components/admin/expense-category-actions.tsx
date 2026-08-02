"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteExpenseCategory } from "@/lib/actions/expense-categories";
import { Pencil, Trash2, Lock } from "lucide-react";
import { ExpenseCategoryFormDialog } from "@/components/admin/expense-category-form";
import type { ExpenseCategory } from "@prisma/client";

export function ExpenseCategoryActions({
  category,
  expensesCount = 0,
}: {
  category: Pick<ExpenseCategory, "id" | "name">;
  expensesCount?: number;
}) {
  const blocked = expensesCount > 0;
  const blockMessage = `Impossible de supprimer : ${expensesCount} dépense(s) liée(s). Déplacez ou supprimez ces dépenses d'abord.`;

  return (
    <div className="flex items-center justify-center gap-1">
      <ExpenseCategoryFormDialog
        category={category as ExpenseCategory}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Modifier la catégorie">
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
          title="Supprimer cette catégorie ?"
          description="Cette action est définitive. Aucune dépense n'est liée à cette catégorie."
          onConfirm={() => deleteExpenseCategory(category.id)}
        >
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Supprimer la catégorie">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
