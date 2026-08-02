export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductZoneFormDialog } from "@/components/admin/product-zone-form";
import { ProductZonesTable } from "@/components/admin/product-zones-table";
import { Plus } from "lucide-react";

export default async function ProductZonesPage() {
  await requirePermission("product_zones.view");

  const zones = await prisma.productZone.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { marquesMaisons: true } } },
  });

  const rows = zones.map((z) => ({
    id: z.id,
    name: z.name,
    isActive: z.isActive,
    marquesCount: z._count.marquesMaisons,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zones"
        description={`${zones.length} zone(s) — classifient géographiquement vos produits.`}
      >
        <ProductZoneFormDialog
          trigger={<Button><Plus className="h-4 w-4" /> Nouvelle zone</Button>}
        />
      </PageHeader>
      <ProductZonesTable rows={rows} />
    </div>
  );
}
