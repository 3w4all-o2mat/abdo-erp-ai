export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaTrendChart, DonutChart } from "@/components/admin/charts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatMoney, formatDate } from "@/lib/utils";
import { getCompanyCurrency } from "@/lib/settings";
import { Receipt, ShoppingCart, Wallet, Package, TrendingUp, Activity, ArrowLeftRight, ClipboardList } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [
    invoices, purchases, orders, paymentsClients, products, stockMovements, recentLogs, recentInvoices, clientsCount, currency,
  ] = await Promise.all([
    prisma.invoice.findMany({ where: { status: "confirmed" }, include: { lines: true } }),
    prisma.purchase.findMany({ where: { status: "confirmed" }, include: { lines: true } }),
    prisma.order.findMany({ where: { status: "confirmed" } }),
    prisma.paymentClient.findMany(),
    prisma.product.findMany({ include: { currentPrice: true, stockMovements: true } }),
    prisma.stockMovement.findMany(),
    prisma.activityLog.findMany({ take: 8, orderBy: { date: "desc" }, include: { user: true } }),
    prisma.invoice.findMany({ take: 6, orderBy: { date: "desc" }, include: { client: true, lines: true } }),
    prisma.client.count(),
    getCompanyCurrency(),
  ]);

  const sumLines = (lines: { amount: { toNumber: () => number } }[]) =>
    lines.reduce((acc, l) => acc + l.amount.toNumber(), 0);

  // Use the persisted `ttcAmount` on confirmed orders so the dashboard total
  // matches the values shown everywhere else (order list, detail page, etc.)
  // and includes TVA + remise. Summing `lines.amount` would only give the
  // pre-tax total.
  const revenue = orders.reduce((acc, o) => acc + o.ttcAmount.toNumber(), 0);
  const purchaseTotal = purchases.reduce((acc, p) => acc + sumLines(p.lines), 0);
  const collected = paymentsClients.reduce((acc, p) => acc + p.amount.toNumber(), 0);
  // Customer receivables (Créances clients):
  //   Σ ttcAmount over confirmed orders  −  Σ amount over all client payments.
  // Clamped at 0 because a negative balance would mean clients are "in credit",
  // which is no longer a receivable.
  const outstanding = Math.max(revenue - collected, 0);

  // Purchases trend: compare the current month with the previous one.
  // "This month" = purchases whose `date` falls between the 1st of the current
  // month and now; "last month" = the full previous calendar month.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const sumPurchasesBetween = (from: Date, to: Date) =>
    purchases.reduce((acc, p) => {
      const d = new Date(p.date);
      return d >= from && d <= to ? acc + sumLines(p.lines) : acc;
    }, 0);

  const purchasesThisMonth = sumPurchasesBetween(monthStart, now);
  const purchasesLastMonth = sumPurchasesBetween(prevMonthStart, prevMonthEnd);
  const purchaseTrend =
    purchasesLastMonth > 0
      ? ((purchasesThisMonth - purchasesLastMonth) / purchasesLastMonth) * 100
      : purchasesThisMonth > 0
        ? 100
        : 0;

  // Orders (revenue) trend: same calendar-month window as purchases above.
  // Drives the "Chiffre d'affaires" StatCard pill.
  const sumOrdersBetween = (from: Date, to: Date) =>
    orders.reduce((acc, o) => {
      const d = new Date(o.date);
      return d >= from && d <= to ? acc + o.ttcAmount.toNumber() : acc;
    }, 0);

  const revenueThisMonth = sumOrdersBetween(monthStart, now);
  const revenueLastMonth = sumOrdersBetween(prevMonthStart, prevMonthEnd);
  const revenueTrend =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0
        ? 100
        : 0;

  // Stock value (sum of qty * cost)
  const stockByProduct = new Map<string, number>();
  for (const m of stockMovements) {
    stockByProduct.set(m.productId, (stockByProduct.get(m.productId) ?? 0) + m.qtySigned.toNumber());
  }
  let stockUnits = 0;
  let stockValue = 0;
  for (const p of products) {
    const qty = stockByProduct.get(p.id) ?? 0;
    stockUnits += qty;
    stockValue += qty * p.costPrice.toNumber();
  }

  // Monthly trend (last 6 months)
  const months: { label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString("fr-FR", { month: "short" }), key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  const trend = months.map((m) => {
    const monthOrders = orders.filter((o) => {
      const d = new Date(o.date);
      return `${d.getFullYear()}-${d.getMonth()}` === m.key;
    });
    const monthPurchases = purchases.filter((p) => {
      const d = new Date(p.date);
      return `${d.getFullYear()}-${d.getMonth()}` === m.key;
    });
    return {
      label: m.label,
      ventes: monthOrders.reduce((a, o) => a + o.ttcAmount.toNumber(), 0),
      achats: monthPurchases.reduce((a, p) => a + sumLines(p.lines), 0),
    };
  });

  // Orders by status (donut)
  const statusCounts = await prisma.order.groupBy({ by: ["status"], _count: true });
  const statusColors: Record<string, string> = {
    draft: "hsl(var(--chart-3))", confirmed: "hsl(var(--chart-1))", canceled: "hsl(var(--chart-5))",
  };
  const statusLabels: Record<string, string> = { draft: "Brouillons", confirmed: "Confirmées", canceled: "Annulées" };
  const donutData = statusCounts.map((s) => ({ name: statusLabels[s.status] ?? s.status, value: s._count, color: statusColors[s.status] ?? "hsl(var(--muted))" }));

  const actionLabels: Record<string, string> = {
    created: "a créé", updated: "a modifié", deleted: "a supprimé", confirmed: "a confirmé", canceled: "a annulé", login: "s'est connecté",
  };
  const entityLabels: Record<string, string> = {
    invoices: "une facture", orders: "une commande", quotations: "un devis", purchases: "un achat", products: "un produit", clients: "un client", users: "un utilisateur",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description={`👋 Bienvenue, ${user?.name ?? "Utilisateur"}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Chiffre d'affaires" value={formatMoney(revenue, currency)} icon={Receipt} trend={revenueTrend} trendLabel="ce mois vs mois dernier" accent="primary" />
        <StatCard title="Total achats" value={formatMoney(purchaseTotal, currency)} icon={ShoppingCart} trend={purchaseTrend} trendLabel="ce mois vs mois dernier" accent="chart-2" />
        <StatCard title="Créances clients" value={formatMoney(outstanding, currency)} icon={Wallet} trend={2.1} trendLabel="ce mois" accent="chart-3" />
        <StatCard title="Dettes fournisseurs" value={formatMoney(stockValue, currency)} icon={Package} trend={0} trendLabel={`${stockUnits} unités`} accent="chart-4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Évolution des <span style={{ color: "hsl(var(--chart-1))" }}>ventes</span> & <span style={{ color: "hsl(var(--chart-2))" }}>achats</span></CardTitle>
              <CardDescription>6 derniers mois</CardDescription>
            </div>
            <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" /> Tendance</Badge>
          </CardHeader>
          <CardContent>
            <AreaTrendChart
              data={trend}
              series={[
                { key: "ventes", name: `Ventes (${currency})`, color: "hsl(var(--chart-1))" },
                { key: "achats", name: `Achats (${currency})`, color: "hsl(var(--chart-2))" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
            <CardDescription>Répartition actuelle</CardDescription>
          </CardHeader>
          <CardContent>
            {donutData.length > 0 ? <DonutChart data={donutData} /> : <p className="text-sm text-muted-foreground text-center py-12">Aucune commande</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Factures récentes</CardTitle>
            <Link href="/admin/invoices" className="text-sm text-primary hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentInvoices.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Aucune facture pour le moment</p>}
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback>{initials(inv.client?.name)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{inv.reference}</p>
                    <p className="text-xs text-muted-foreground">{inv.client?.name} · {formatDate(inv.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatMoney(sumLines(inv.lines), currency)}</p>
                  <Badge variant={inv.status === "confirmed" ? "success" : inv.status === "canceled" ? "destructive" : "secondary"} className="mt-0.5">
                    {inv.status === "confirmed" ? "Confirmée" : inv.status === "canceled" ? "Annulée" : "Brouillon"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Activité récente</CardTitle>
            <Link href="/admin/audit" className="text-sm text-primary hover:underline">Journal</Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentLogs.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Aucune activité enregistrée</p>}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                <Avatar className="h-8 w-8"><AvatarFallback>{initials(log.user?.fullName)}</AvatarFallback></Avatar>
                <div className="text-sm">
                  <p>
                    <span className="font-medium">{log.user?.fullName}</span>{" "}
                    <span className="text-muted-foreground">{actionLabels[log.action] ?? log.action}</span>{" "}
                    <span className="font-medium">{entityLabels[log.entity] ?? log.entity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(log.date, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center gap-3 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">Commandes confirmées</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2"><ShoppingCart className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold">{purchases.length}</p><p className="text-xs text-muted-foreground">Achats confirmés</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3"><Activity className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold">{clientsCount}</p><p className="text-xs text-muted-foreground">Clients</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4"><Package className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">Produits</p></div>
        </Card>
      </div>
    </div>
  );
}
