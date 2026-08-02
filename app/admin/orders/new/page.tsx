export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";
import { Button } from "@/components/ui/button";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings, getPaymentDisplay } from "@/lib/settings";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ fromQuotation?: string }> }) {
  await requirePermission("orders.create");
  const { fromQuotation } = await searchParams;

  // Optionally pre-fill the order from a source quotation. We still load the
  // full catalogues below so the new-order form behaves identically whether
  // or not a source is provided.
  const sourceQuotation = fromQuotation
    ? await prisma.quotation.findUnique({
        where: { id: fromQuotation },
        include: { lines: true, client: true, stock: true },
      })
    : null;

  if (fromQuotation && !sourceQuotation) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/quotations"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Devis introuvable — impossible de pré-remplir la commande.</p>
      </div>
    );
  }

  const [clients, stocks, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings, paymentDisplayDefault] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true, isStockable: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "orders.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
    getPaymentDisplay(),
  ]);
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));

  const initial = sourceQuotation
    ? {
        // No `reference` — let `nextReference("orders")` generate a fresh one.
        date: sourceQuotation.date.toISOString().slice(0, 10),
        partnerId: sourceQuotation.clientId,
        stockId: sourceQuotation.stockId,
        withTva: sourceQuotation.withTva,
        withRemise: sourceQuotation.withRemise,
        remiseAmount: sourceQuotation.remiseAmount.toNumber(),
        lines: sourceQuotation.lines.map((l) => ({
          id: l.id,
          productId: l.productId,
          designation: l.designation,
          qty: l.qty.toNumber(),
          unitPrice: l.unitPrice.toNumber(),
          discountRate: l.discountRate.toNumber(),
          vatRate: l.vatRate.toNumber(),
          amount: l.amount.toNumber(),
        })),
      }
    : undefined;

  return (
    <>
      {sourceQuotation && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/quotations/${sourceQuotation.id}`}>
                <ArrowLeft className="h-4 w-4" /> Retour au devis
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Nouvelle commande depuis le devis {sourceQuotation.reference}
            </h1>
          </div>
        </div>
      )}
      <DocumentForm
        type="order"
        sourceQuotationId={sourceQuotation?.id}
        initial={initial}
        partners={clients}
        partnerLabel="Client"
        stocks={stocks}
        products={productOptions}
        showStock
        vatEnabled={vatSetting?.value === "true"}
        remiseEnabled={remiseSetting?.value === "true"}
        companyVatRate={Number(vatRateSetting?.value ?? 0)}
        templateHeader={templateHeader}
        templateFooter={templateFooter}
        companySettings={companySettings}
        paymentDisplayDefault={paymentDisplayDefault}
        hideBackButton={!sourceQuotation}
      />
    </>
  );
}
