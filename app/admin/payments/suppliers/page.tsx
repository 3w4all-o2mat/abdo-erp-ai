export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog } from "@/components/admin/payment-form";
import { PaymentsSuppliersTable } from "@/components/admin/admin-table";
import { Plus } from "lucide-react";

export default async function PaymentsSuppliersPage() {
  await requirePermission("payments_suppliers.view");
  const [payments, suppliers] = await Promise.all([
    prisma.paymentSupplier.findMany({ orderBy: { date: "desc" }, include: { supplier: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Paiements fournisseurs" description={`${payments.length} paiement(s)`}>
        <PaymentFormDialog kind="supplier" partners={suppliers} trigger={<Button><Plus className="h-4 w-4" /> Nouveau paiement</Button>} />
      </PageHeader>
      <PaymentsSuppliersTable showHeader={false} rows={payments.map((p) => ({
        id: p.id,
        date: p.date,
        supplier: p.supplier ? { name: p.supplier.name } : null,
        amount: p.amount.toNumber(),
        paymentMethod: p.paymentMethod,
        observation: p.observation,
      }))} suppliers={suppliers} />
    </div>
  );
}
