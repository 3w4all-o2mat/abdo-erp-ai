export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductMarqueFiltreFormDialog } from "@/components/admin/product-marque-filtre-form";
import { ProductMarquesFiltreTable } from "@/components/admin/product-marques-filtre-table";
import { Plus } from "lucide-react";

export default async function ProductMarquesFiltrePage() {
  await requirePermission("product_marques_filtre.view");

  const marques = await prisma.productMarqueFiltre.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const rows = marques.map((m) => ({
    id: m.id,
    name: m.name,
    isActive: m.isActive,
    productsCount: m._count.products,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marques de filtre"
        description={`${marques.length} marque(s) de filtre — liées à vos produits.`}
      >
        <ProductMarqueFiltreFormDialog
          trigger={<Button><Plus className="h-4 w-4" /> Nouvelle marque de filtre</Button>}
        />
      </PageHeader>
      <ProductMarquesFiltreTable rows={rows} />
    </div>
  );
}
