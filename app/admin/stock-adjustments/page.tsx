export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { StockAdjustmentsTable } from "@/components/admin/admin-table";

export default async function StockAdjustmentsPage() {
  await requirePermission("stock_adjustments.view");
  const docs = await prisma.stockAdjustment.findMany({
    orderBy: { date: "desc" },
    include: {
      stock: { select: { name: true } },
      lines: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <StockAdjustmentsTable rows={docs} />
    </div>
  );
}
