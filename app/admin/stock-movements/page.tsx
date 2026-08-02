import { prisma } from "@/lib/prisma";
import { requirePermission, accessibleStocks } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { MovementsTable, type MovementRow } from "@/components/admin/movements-table";

export const dynamic = "force-dynamic";

export default async function StockMovementsPage() {
  const user = await requirePermission("stock_movements.view");

  // All stocks first, so we can scope the query to the user's accessible ones
  // (Admins see everything; non-admins are filtered to user.stocks).
  const allStocks = await prisma.stock.findMany({ select: { id: true } });
  const allowedStockIds = accessibleStocks(user, allStocks.map((s) => s.id));

  // Fetch confirmed movements of orders and purchases (the only sourceTypes
  // we expose on this page). Transfers/adjustments live on their own pages.
  const movements = await prisma.stockMovement.findMany({
    where: {
      stockId: { in: allowedStockIds },
      sourceType: { in: ["order", "purchase"] },
    },
    orderBy: { date: "desc" },
    take: 10_000,
    include: {
      product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
      stock: { select: { id: true, name: true } },
    },
  });

  // Bulk-fetch the parent documents so we can show the seller (user) and the
  // document reference. Two simple in(...) queries keep this O(2) regardless
  // of how many movements are returned.
  const orderSourceIds = Array.from(
    new Set(movements.filter((m) => m.sourceType === "order").map((m) => m.sourceId)),
  );
  const purchaseSourceIds = Array.from(
    new Set(movements.filter((m) => m.sourceType === "purchase").map((m) => m.sourceId)),
  );

  const [orders, purchases] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: orderSourceIds } },
      select: { id: true, reference: true, userId: true, user: { select: { id: true, fullName: true, username: true } } },
    }),
    prisma.purchase.findMany({
      where: { id: { in: purchaseSourceIds } },
      select: { id: true, reference: true, userId: true, user: { select: { id: true, fullName: true, username: true } } },
    }),
  ]);

  const orderById = new Map(orders.map((o) => [o.id, o]));
  const purchaseById = new Map(purchases.map((p) => [p.id, p]));

  // Serialize for the client. Decimals → number, dates → Date.
  const rows: MovementRow[] = movements.map((m) => {
    const parent =
      m.sourceType === "order"
        ? orderById.get(m.sourceId)
        : m.sourceType === "purchase"
          ? purchaseById.get(m.sourceId)
          : null;
    return {
      id: m.id,
      date: m.date,
      productId: m.productId,
      productName: m.product?.name ?? "—",
      productSku: m.product?.sku ?? "",
      unit: m.product?.unitOfMeasure ?? "",
      stockId: m.stockId,
      stockName: m.stock?.name ?? "—",
      qtySigned: m.qtySigned.toNumber(),
      sourceType: m.sourceType as "order" | "purchase",
      sourceId: m.sourceId,
      reference: parent?.reference ?? m.sourceId.slice(0, 8),
      userId: parent?.userId ?? "",
      userName: parent?.user?.fullName ?? parent?.user?.username ?? "—",
    };
  });

  // Dropdown options (scoped to the user's accessible stocks).
  const [stocks, products, allUsers] = await Promise.all([
    prisma.stock.findMany({
      where: { id: { in: allowedStockIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
    // Distinct sellers present in the result set (avoid listing the entire user table).
    prisma.user.findMany({
      where: { id: { in: Array.from(new Set(rows.map((r) => r.userId).filter(Boolean))) } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, username: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mouvements de stock"
        description={`${rows.length} mouvement(s) — journal des opérations confirmées (commandes & achats)`}
      />
      <MovementsTable
        rows={rows}
        stocks={stocks}
        products={products}
        users={allUsers.map((u) => ({ id: u.id, label: u.fullName || u.username }))}
      />
    </div>
  );
}
