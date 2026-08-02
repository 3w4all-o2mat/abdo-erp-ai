export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "@/components/admin/product-form";
import { ProductsTable } from "@/components/admin/admin-table";
import { Plus } from "lucide-react";

export default async function ProductsPage() {
  await requirePermission("products.view");
  const [products, categories, mouvements, moteurs, marquesFiltres, marquesMaisons] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        category: true,
        currentPrice: true,
        moteur: { select: { id: true, name: true } },
        marqueFiltre: { select: { id: true, name: true } },
        marquesMaisons: { include: { marqueMaison: { select: { id: true, name: true } } } },
      },
    }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany(),
    prisma.productMoteur.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productMarqueFiltre.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productMarqueMaison.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const stockByProduct = new Map<string, number>();
  for (const m of mouvements) stockByProduct.set(m.productId, (stockByProduct.get(m.productId) ?? 0) + m.qtySigned.toNumber());

  const serialized = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category ? { name: p.category.name } : null,
    currentPrice: p.currentPrice ? { unitPrice: p.currentPrice.unitPrice.toNumber() } : null,
    unitOfMeasure: p.unitOfMeasure,
    isActive: p.isActive,
    image: p.image ?? null,
    moteur: p.moteur ? { name: p.moteur.name } : null,
    marqueFiltre: p.marqueFiltre ? { name: p.marqueFiltre.name } : null,
    marquesMaisons: p.marquesMaisons.map((mm) => ({ name: mm.marqueMaison.name })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Produits" description={`${products.length} produit(s)`}>
        <ProductFormDialog
          categories={categories}
          moteurs={moteurs}
          marquesFiltres={marquesFiltres}
          marquesMaisons={marquesMaisons}
          trigger={<Button><Plus className="h-4 w-4" /> Nouveau produit</Button>}
        />
      </PageHeader>
      <ProductsTable rows={serialized} categories={categories} stockByProduct={stockByProduct} showHeader={false} />
    </div>
  );
}
