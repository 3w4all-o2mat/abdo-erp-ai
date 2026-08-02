export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DocumentForm } from "@/components/admin/document-form";
import { getPrintHeader, getPrintFooter, getCompanyAndSiteSettings } from "@/lib/settings";

export default async function NewInvoicePage() {
  await requirePermission("invoices.create");
  const [clients, products, vatSetting, vatRateSetting, remiseSetting, templateHeader, templateFooter, companySettings] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true }, orderBy: { name: "asc" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_enabled" } }),
    prisma.setting.findUnique({ where: { key: "company.vat_rate" } }),
    prisma.setting.findUnique({ where: { key: "invoices.remise_exists" } }),
    getPrintHeader(),
    getPrintFooter(),
    getCompanyAndSiteSettings(),
  ]);
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitPrice: p.currentPrice?.unitPrice.toNumber() ?? 0, unitOfMeasure: p.unitOfMeasure }));
  return (
    <DocumentForm
      type="invoice"
      partners={clients}
      partnerLabel="Client"
      stocks={[]}
      products={productOptions}
      vatEnabled={vatSetting?.value === "true"}
      remiseEnabled={remiseSetting?.value === "true"}
      companyVatRate={Number(vatRateSetting?.value ?? 0)}
      templateHeader={templateHeader}
      templateFooter={templateFooter}
      companySettings={companySettings}
    />
  );
}
