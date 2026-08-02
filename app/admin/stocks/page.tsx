export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockFormDialog } from "@/components/admin/stock-form";
import { StockActions } from "@/components/admin/stock-actions";
import { StockViewProvider, StockViewToggle } from "@/components/admin/stock-view-switcher";
import { formatMoney, formatNumber } from "@/lib/utils";
import { Plus, Warehouse, MapPin } from "lucide-react";

export default async function StocksPage() {
  await requirePermission("stocks.view");
  const [stocks, movements, products] = await Promise.all([
    prisma.stock.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } }),
    prisma.stockMovement.findMany(),
    prisma.product.findMany(),
  ]);

  const stockValueByStock = new Map<string, { qty: number; value: number }>();
  const productCost = new Map(products.map((p) => [p.id, p.costPrice.toNumber()]));
  for (const m of movements) {
    const cur = stockValueByStock.get(m.stockId) ?? { qty: 0, value: 0 };
    const q = m.qtySigned.toNumber();
    cur.qty += q;
    cur.value += q * (productCost.get(m.productId) ?? 0);
    stockValueByStock.set(m.stockId, cur);
  }

  return (
    <StockViewProvider
      stocks={stocks.map((s) => {
        const v = stockValueByStock.get(s.id) ?? { qty: 0, value: 0 };
        return {
          id: s.id,
          name: s.name,
          address: s.address,
          isDefault: s.isDefault,
          qty: v.qty,
          value: v.value,
          users: s._count.users,
        };
      })}
    >
      <div className="space-y-6">
        <PageHeader title="Stocks" description={`${stocks.length} entrepôt(s)`}>
          <StockViewToggle />
          <StockFormDialog trigger={<Button><Plus className="h-4 w-4" /> Nouveau stock</Button>} />
        </PageHeader>
      </div>
    </StockViewProvider>
  );
}
