export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentList } from "@/components/admin/document-list";

export default async function PurchasesPage() {
  await requirePermission("purchases.view");
  const docs = await prisma.purchase.findMany({ orderBy: { date: "desc" }, include: { supplier: true, lines: true } });
  const rows = docs.map((d) => ({
    id: d.id, reference: d.reference, date: d.date, status: d.status,
    partnerName: d.supplier?.name ?? "—",
    total: d.lines.reduce((a, l) => a + l.amount.toNumber(), 0),
  }));
  return <DocumentList rows={rows} newHref="/admin/purchases/new" entity="purchases" title="Achats" countLabel={`${rows.length} achat(s)`} searchPlaceholder="Rechercher un achat..." newLabel="Nouvel Achat" statusFilter={{ placeholder: "Tous", options: [{ value: "draft", label: "Brouillon" }, { value: "confirmed", label: "Confirmés" }, { value: "canceled", label: "Annulés" }] }} />;
}
