export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentList } from "@/components/admin/document-list";

export default async function OrdersPage() {
  await requirePermission("orders.view");
  const docs = await prisma.order.findMany({ orderBy: { date: "desc" }, include: { client: true, lines: true } });
  const rows = docs.map((d) => ({
    id: d.id, reference: d.reference, date: d.date, status: d.status,
    partnerName: d.client?.name ?? "—",
    total: d.ttcAmount.toNumber(),
  }));
  return <DocumentList rows={rows} newHref="/admin/orders/new" entity="orders" title="Commandes" countLabel={`${rows.length} commande(s)`} searchPlaceholder="Rechercher une commande..." newLabel="Nouvelle Commande" statusFilter={{ placeholder: "Tous", options: [{ value: "draft", label: "Brouillon" }, { value: "confirmed", label: "Confirmées" }, { value: "canceled", label: "Annulées" }] }} />;
}
