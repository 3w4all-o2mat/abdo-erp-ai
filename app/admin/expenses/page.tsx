export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "@/components/admin/expense-form";
import { ExpensesTable } from "@/components/admin/admin-table";
import { Plus } from "lucide-react";

export default async function ExpensesPage() {
  await requirePermission("expenses.view");
  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" }, include: { expenseCategory: true } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dépenses" description={`${expenses.length} dépense(s)`}>
        <ExpenseFormDialog categories={categories} trigger={<Button><Plus className="h-4 w-4" /> Nouvelle dépense</Button>} />
      </PageHeader>
      <ExpensesTable rows={expenses.map((e) => ({
        id: e.id,
        date: e.date,
        expenseCategoryId: e.expenseCategoryId,
        expenseCategory: e.expenseCategory ? { name: e.expenseCategory.name } : null,
        amount: e.amount.toNumber(),
        observation: e.observation,
      }))} categories={categories} />
    </div>
  );
}
