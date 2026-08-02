export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ExpenseCategoryFormDialog } from "@/components/admin/expense-category-form";
import { ExpenseCategoriesTable } from "@/components/admin/expense-categories-table";
import { ArrowLeft, Plus } from "lucide-react";

export default async function ExpenseCategoriesPage() {
  await requirePermission("expenses.view");

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true } } },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
    expensesCount: c._count.expenses,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
          <Link href="/admin/expenses"><ArrowLeft className="h-4 w-4" /> Retour aux dépenses</Link>
        </Button>
        <PageHeader
          title="Catégories de dépenses"
          description={`${categories.length} catégorie(s) — utilisées pour classer vos dépenses.`}
        >
          <ExpenseCategoryFormDialog
            trigger={<Button><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>}
          />
        </PageHeader>
      </div>

      <ExpenseCategoriesTable rows={rows} />
    </div>
  );
}
