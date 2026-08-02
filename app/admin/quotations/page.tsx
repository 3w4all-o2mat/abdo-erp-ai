export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentList } from "@/components/admin/document-list";

export default async function QuotationsPage() {
  await requirePermission("quotations.view");
  const docs = await prisma.quotation.findMany({ orderBy: { date: "desc" }, include: { client: true, lines: true } });
  const rows = docs.map((d) => ({
    id: d.id, reference: d.reference, date: d.date, status: d.status,
    partnerName: d.client?.name ?? "—",
    total: d.ttcAmount.toNumber(),
  }));
  return (
    <DocumentList
      rows={rows}
      newHref="/admin/quotations/new"
      entity="quotations"
      title="Devis"
      countLabel={`${rows.length} devis`}
      searchPlaceholder="Rechercher un devis..."
      newLabel="Nouveau Devis"
      statusFilter={{
        placeholder: "Tous les statuts",
        options: [
          { value: "all", label: "Tous" },
          { value: "draft", label: "Brouillons" },
          { value: "confirmed", label: "Confirmés" },
          { value: "canceled", label: "Annulés" },
        ],
      }}
    />
  );
}
