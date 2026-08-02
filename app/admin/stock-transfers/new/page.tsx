export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TransferForm } from "@/components/admin/transfer-form";

export default async function NewTransferPage() {
  await requirePermission("stock_transfers.create");
  const [stocks, products] = await Promise.all([
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true, isStockable: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
  ]);
  return <TransferForm stocks={stocks} products={products} />;
}
