export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";
import { Button } from "@/components/ui/button";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings, getPaymentDisplay, getOrderPaymentStats } from "@/lib/settings";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("orders.view");
  const [doc, clients, stocks, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings, payments, paymentDisplayDefault] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { client: true, lines: true } }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true, isStockable: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "orders.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
    prisma.paymentClient.findMany({ where: { orderId: id }, orderBy: { date: "desc" } }),
    getPaymentDisplay(),
    // Aggregates for the totals block under Total TTC. Real values are
    // fetched below once we know the order's `clientId`. We seed this entry
    // with empty values so the array shape is stable.
    Promise.resolve({ reglements: 0, clientOldDebt: 0, clientRemaining: 0 }),
  ]);
  if (!doc) return <p>Commande introuvable</p>;
  // Real aggregates — must run after the `if (!doc)` check so `doc.clientId`
  // is guaranteed to be defined. Not in the Promise.all above because the
  // function takes `doc.clientId` as input.
  const orderPaymentStats = await getOrderPaymentStats(doc.id, doc.clientId);
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        </div>
      </div>
      <DocumentForm
      type="order" docId={doc.id}
      initial={{
        reference: doc.reference, date: doc.date.toISOString().slice(0, 10),
        partnerId: doc.clientId, stockId: doc.stockId, status: doc.status,
        paymentDisplay: (doc.paymentDisplay as "hide" | "payments_only" | "payments_and_debts" | null) ?? null,
        withTva: doc.withTva,
        withRemise: doc.withRemise,
        remiseAmount: doc.remiseAmount.toNumber(),
        lines: doc.lines.map((l) => ({ id: l.id, productId: l.productId, designation: l.designation, qty: l.qty.toNumber(), unitPrice: l.unitPrice.toNumber(), discountRate: l.discountRate.toNumber(), vatRate: l.vatRate.toNumber(), amount: l.amount.toNumber() })),
      }}
      paymentDisplayDefault={paymentDisplayDefault}
      partners={clients} partnerLabel="Client" stocks={stocks} products={productOptions} showStock vatEnabled={vatSetting?.value === "true"} remiseEnabled={remiseSetting?.value === "true"} companyVatRate={Number(vatRateSetting?.value ?? 0)}
      templateHeader={templateHeader} templateFooter={templateFooter} companySettings={companySettings} hideBackButton
      orderPayments={{
        orderId: doc.id,
        clientId: doc.clientId,
        clientName: doc.client?.name ?? "",
        ttcAmount: doc.ttcAmount.toNumber(),
        reglements: orderPaymentStats.reglements,
        clientOldDebt: orderPaymentStats.clientOldDebt,
        clientRemaining: orderPaymentStats.clientRemaining,
        payments: payments.map((p) => ({
          id: p.id,
          date: p.date,
          clientId: p.clientId,
          client: null,
          amount: p.amount.toNumber(),
          paymentMethod: p.paymentMethod,
          observation: p.observation,
        })),
      }}
    />
    </>
  );
}
