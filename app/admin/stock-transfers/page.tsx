export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { StockTransfersTable } from "@/components/admin/admin-table";

export default async function StockTransfersPage() {
  await requirePermission("stock_transfers.view");
  const docs = await prisma.stockTransfer.findMany({
    orderBy: { date: "desc" },
    include: {
      fromStock: { select: { name: true } },
      toStock: { select: { name: true } },
      lines: { select: { id: true } },
    },
  });

  return (
    <div>
      <StockTransfersTable rows={docs} />
    </div>
  );
}
