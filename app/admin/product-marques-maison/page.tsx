export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductMarqueMaisonFormDialog } from "@/components/admin/product-marque-maison-form";
import { ProductMarquesMaisonTable } from "@/components/admin/product-marques-maison-table";
import { Plus } from "lucide-react";

export default async function ProductMarquesMaisonPage() {
  await requirePermission("product_marques_maison.view");

  const [marques, zones] = await Promise.all([
    prisma.productMarqueMaison.findMany({
      orderBy: { name: "asc" },
      include: {
        zone: true,
        _count: { select: { marquesMaisons: true } },
      },
    }),
    prisma.productZone.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = marques.map((m) => ({
    id: m.id,
    name: m.name,
    zoneId: m.zoneId ?? "",
    zoneName: m.zone?.name ?? "",
    isActive: m.isActive,
    productsCount: m._count.marquesMaisons,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marques maison"
        description={`${marques.length} marque(s) maison — liées à des produits via la zone parente.`}
      >
        <ProductMarqueMaisonFormDialog
          zones={zones}
          trigger={<Button><Plus className="h-4 w-4" /> Nouvelle marque maison</Button>}
        />
      </PageHeader>
      <ProductMarquesMaisonTable rows={rows} zones={zones} />
    </div>
  );
}
