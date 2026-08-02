export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings, getDefaultQuotationExpiry } from "@/lib/settings";
import { DocumentForm } from "@/components/admin/document-form";

export default async function NewQuotationPage() {
  await requirePermission("quotations.create");
  const [clients, stocks, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings, defaultExpiry] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.stock.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "quotations.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
    getDefaultQuotationExpiry(),
  ]);
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <DocumentForm
      type="quotation"
      partners={clients}
      partnerLabel="Client"
      stocks={stocks}
      products={productOptions}
      showStock
      showExpiring
      vatEnabled={vatSetting?.value === "true"}
      remiseEnabled={remiseSetting?.value === "true"}
      companyVatRate={Number(vatRateSetting?.value ?? 0)}
      templateHeader={templateHeader}
      templateFooter={templateFooter}
      companySettings={companySettings}
      initial={{ expiringDate: defaultExpiry ? defaultExpiry.toISOString().slice(0, 10) : undefined }}
    />
  );
}
