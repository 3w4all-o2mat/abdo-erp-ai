export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";
import { Button } from "@/components/ui/button";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings } from "@/lib/settings";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("invoices.view");
  const [doc, clients, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { client: true, lines: true } }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "invoices.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
  ]);
  if (!doc) return <p>Facture introuvable</p>;
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/invoices">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
        </div>
      </div>
      <DocumentForm
      type="invoice" docId={doc.id}
      initial={{
        reference: doc.reference, date: doc.date.toISOString().slice(0, 10),
        partnerId: doc.clientId, status: doc.status, orderId: doc.orderId,
        withTva: doc.withTva,
        withRemise: doc.withRemise,
        remiseAmount: doc.remiseAmount.toNumber(),
        lines: doc.lines.map((l) => ({ id: l.id, productId: l.productId, designation: l.designation, qty: l.qty.toNumber(), unitPrice: l.unitPrice.toNumber(), discountRate: l.discountRate.toNumber(), vatRate: l.vatRate.toNumber(), amount: l.amount.toNumber() })),
      }}
      partners={clients} partnerLabel="Client" stocks={[]} products={productOptions} orderId={doc.orderId} vatEnabled={vatSetting?.value === "true"} remiseEnabled={remiseSetting?.value === "true"} companyVatRate={Number(vatRateSetting?.value ?? 0)}
      templateHeader={templateHeader} templateFooter={templateFooter} companySettings={companySettings} hideBackButton
    />
    </>
  );
}
