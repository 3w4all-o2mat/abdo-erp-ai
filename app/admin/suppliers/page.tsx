export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { SupplierFormDialog } from "@/components/admin/supplier-form";
import { Plus } from "lucide-react";
import { SuppliersTable } from "@/components/admin/admin-table";

export default async function SuppliersPage() {
  await requirePermission("suppliers.view");
  const [suppliers, wilayas] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, include: { wilaya: true, commune: true } }),
    prisma.wilaya.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fournisseurs" description={`${suppliers.length} fournisseur(s)`}>
        <SupplierFormDialog wilayas={wilayas} trigger={<Button><Plus className="h-4 w-4" /> Nouveau fournisseur</Button>} />
      </PageHeader>
      <SuppliersTable rows={suppliers} wilayas={wilayas} />
    </div>
  );
}
