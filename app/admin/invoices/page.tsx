export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentList } from "@/components/admin/document-list";

export default async function InvoicesPage() {
  await requirePermission("invoices.view");
  const docs = await prisma.invoice.findMany({ orderBy: { date: "desc" }, include: { client: true, lines: true } });
  const rows = docs.map((d) => ({
    id: d.id, reference: d.reference, date: d.date, status: d.status,
    partnerName: d.client?.name ?? "—",
    total: d.ttcAmount.toNumber(),
  }));
  return <DocumentList rows={rows} newHref="/admin/invoices/new" entity="invoices" title="Factures" countLabel={`${rows.length} facture(s)`} searchPlaceholder="Rechercher une facture..." newLabel="Nouvelle Facture" />;
}
