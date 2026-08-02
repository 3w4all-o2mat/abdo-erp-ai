export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings } from "@/lib/settings";

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("purchases.view");
  const [doc, suppliers, stocks, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings] = await Promise.all([
    prisma.purchase.findUnique({ where: { id }, include: { supplier: true, lines: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true, isStockable: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "purchases.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
  ]);
  if (!doc) return <p>Achat introuvable</p>;
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <DocumentForm
      type="purchase" docId={doc.id}
      initial={{
        reference: doc.reference, date: doc.date.toISOString().slice(0, 10),
        partnerId: doc.supplierId, stockId: doc.stockId, status: doc.status,
        withTva: doc.withTva, withRemise: doc.withRemise, remiseAmount: doc.remiseAmount.toNumber(),
        lines: doc.lines.map((l) => ({ id: l.id, productId: l.productId, designation: l.designation, qty: l.qty.toNumber(), unitPrice: l.unitPrice.toNumber(), discountRate: l.discountRate.toNumber(), vatRate: l.vatRate.toNumber(), amount: l.amount.toNumber() })),
      }}
      partners={suppliers} partnerLabel="Fournisseur" stocks={stocks} products={productOptions} showStock vatEnabled={vatSetting?.value === "true"} remiseEnabled={remiseSetting?.value === "true"} companyVatRate={Number(vatRateSetting?.value ?? 0)}
      templateHeader={templateHeader} templateFooter={templateFooter} companySettings={companySettings}
    />
  );
}
