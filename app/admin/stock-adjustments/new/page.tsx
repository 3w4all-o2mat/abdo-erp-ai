export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { AdjustmentForm } from "@/components/admin/adjustment-form";

export default async function NewAdjustmentPage() {
  await requirePermission("stock_adjustments.create");
  const [stocks, products] = await Promise.all([
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true, isStockable: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
  ]);
  return <AdjustmentForm stocks={stocks} products={products} />;
}
