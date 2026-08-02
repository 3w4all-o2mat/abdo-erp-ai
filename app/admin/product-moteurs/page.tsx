export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductMoteurFormDialog } from "@/components/admin/product-moteur-form";
import { ProductMoteursTable } from "@/components/admin/product-moteurs-table";
import { Plus } from "lucide-react";

export default async function ProductMoteursPage() {
  await requirePermission("product_moteurs.view");

  const moteurs = await prisma.productMoteur.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const rows = moteurs.map((m) => ({
    id: m.id,
    name: m.name,
    isActive: m.isActive,
    productsCount: m._count.products,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moteurs"
        description={`${moteurs.length} moteur(s) — liés à vos produits.`}
      >
        <ProductMoteurFormDialog
          trigger={<Button><Plus className="h-4 w-4" /> Nouveau moteur</Button>}
        />
      </PageHeader>
      <ProductMoteursTable rows={rows} />
    </div>
  );
}
