export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { SupplierFormDialog } from "@/components/admin/supplier-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SupplierEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("suppliers.update");
  const [supplier, wilayas] = await Promise.all([
    prisma.supplier.findUnique({ where: { id }, include: { wilaya: true, commune: true } }),
    prisma.wilaya.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!supplier) return <p>Fournisseur introuvable</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={supplier.name} description="Modifier le fournisseur">
        <Button asChild variant="outline"><Link href="/admin/suppliers"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      </PageHeader>
      <SupplierFormDialog supplier={supplier} wilayas={wilayas} trigger={<Button>Modifier</Button>} />
    </div>
  );
}
