"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createExpenseCategory(data: { name: string }) {
  const user = await requirePermission("expense_categories.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const cat = await prisma.expenseCategory.create({ data: { name } });
  await logActivity({ userId: user.id, action: "created", entity: "expense_categories", entityId: cat.id });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/expenses/categories");
}

export async function updateExpenseCategory(id: string, data: { name: string }) {
  const user = await requirePermission("expense_categories.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.expenseCategory.update({ where: { id }, data: { name } });
  await logActivity({ userId: user.id, action: "updated", entity: "expense_categories", entityId: id });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/expenses/categories");
}

export async function deleteExpenseCategory(id: string) {
  const user = await requirePermission("expense_categories.manage");
  const expensesCount = await prisma.expense.count({ where: { expenseCategoryId: id } });
  if (expensesCount > 0) {
    throw new Error(
      `Impossible de supprimer cette catégorie : ${expensesCount} dépense(s) y sont encore liées. Déplacez ou supprimez ces dépenses d'abord.`,
    );
  }
  await prisma.expenseCategory.delete({ where: { id } });
  await logActivity({ userId: user.id, action: "deleted", entity: "expense_categories", entityId: id });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/expenses/categories");
}
