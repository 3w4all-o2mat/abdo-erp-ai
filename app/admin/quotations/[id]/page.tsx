export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("quotations.view");
  const [doc, clients, products, vatSetting, remiseSetting] = await Promise.all([
    prisma.quotation.findUnique({ where: { id }, include: { client: true, lines: true } }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "quotations.remise_exists" } }),
  ]);
  if (!doc) return <p>Devis introuvable</p>;
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <DocumentForm
      type="quotation" docId={doc.id}
      initial={{
        reference: doc.reference, date: doc.date.toISOString().slice(0, 10),
        expiringDate: doc.expiringDate?.toISOString().slice(0, 10),
        partnerId: doc.clientId, status: doc.status,
        withTva: doc.withTva,
        withRemise: doc.withRemise,
        remiseAmount: doc.remiseAmount.toNumber(),
        lines: doc.lines.map((l) => ({ id: l.id, productId: l.productId, designation: l.designation, qty: l.qty.toNumber(), unitPrice: l.unitPrice.toNumber(), discountRate: l.discountRate.toNumber(), vatRate: l.vatRate.toNumber(), amount: l.amount.toNumber() })),
      }}
      partners={clients} partnerLabel="Client" stocks={[]} products={productOptions} showExpiring vatEnabled={vatSetting?.value === "true"} remiseEnabled={remiseSetting?.value === "true"}
    />
  );
}
