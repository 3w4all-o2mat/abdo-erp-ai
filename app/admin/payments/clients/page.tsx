export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog } from "@/components/admin/payment-form";
import { PaymentsClientsTable } from "@/components/admin/admin-table";
import { Plus } from "lucide-react";

export default async function PaymentsClientsPage() {
  await requirePermission("payments_clients.view");
  const [payments, clients] = await Promise.all([
    prisma.paymentClient.findMany({ orderBy: { date: "desc" }, include: { client: true } }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Paiements clients" description={`${payments.length} paiement(s)`}>
        <PaymentFormDialog kind="client" partners={clients} trigger={<Button><Plus className="h-4 w-4" /> Nouveau paiement</Button>} />
      </PageHeader>
      <PaymentsClientsTable rows={payments.map((p) => ({
        id: p.id,
        date: p.date,
        clientId: p.clientId,
        client: p.client ? { name: p.client.name } : null,
        amount: p.amount.toNumber(),
        paymentMethod: p.paymentMethod,
        observation: p.observation,
      }))} clients={clients} />
    </div>
  );
}
