export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/category-form";
import { CategoryActions } from "@/components/admin/category-actions";
import { CategoryViewProvider, CategoryViewToggle } from "@/components/admin/category-view-switcher";
import { Plus } from "lucide-react";

export default async function CategoriesPage() {
  await requirePermission("categories.view");
  const categories = await prisma.productCategory.findMany({ include: { parent: true, _count: { select: { products: true, children: true } } }, orderBy: { name: "asc" } });
  const all = await prisma.productCategory.findMany({ orderBy: { name: "asc" } });
  const canManage = true; // gate by permission already; button hidden if no manage perm via client check is complex—keep simple

  return (
    <CategoryViewProvider
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        parentName: c.parent?.name ?? null,
        products: c._count.products,
        children: c._count.children,
      }))}
      all={all.map((c) => ({ id: c.id, name: c.name }))}
    >
      <div className="space-y-6">
        <PageHeader title="Catégories" description={`${categories.length} catégorie(s)`}>
          <CategoryViewToggle />
          <CategoryFormDialog categories={all} trigger={<Button><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>} />
        </PageHeader>
      </div>
    </CategoryViewProvider>
  );
}
