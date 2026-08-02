export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductTypeMoteurFormDialog } from "@/components/admin/product-type-moteur-form";
import { ProductTypesMoteurTable } from "@/components/admin/product-types-moteur-table";
import { Plus } from "lucide-react";

export default async function ProductTypesMoteurPage() {
  await requirePermission("product_types_moteur.view");

  const types = await prisma.productTypeMoteur.findMany({
    orderBy: { name: "asc" },
  });

  const rows = types.map((t) => ({
    id: t.id,
    name: t.name,
    isActive: t.isActive,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Types de moteur"
        description={`${types.length} type(s) de moteur — classifient les moteurs (thermique, électrique, etc.).`}
      >
        <ProductTypeMoteurFormDialog
          trigger={<Button><Plus className="h-4 w-4" /> Nouveau type de moteur</Button>}
        />
      </PageHeader>
      <ProductTypesMoteurTable rows={rows} />
    </div>
  );
}
