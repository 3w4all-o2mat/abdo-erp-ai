"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type SupplierInput = {
  name: string; phone?: string; email?: string; address?: string; taxId?: string;
  wilayaId?: number | null; communeId?: number | null; isActive: boolean;
};

export async function createSupplier(data: SupplierInput) {
  const user = await requirePermission("suppliers.create");
  const supplier = await prisma.supplier.create({
    data: {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, taxId: data.taxId || null,
      wilayaId: data.wilayaId ?? null, communeId: data.communeId ?? null, isActive: data.isActive,
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "suppliers", entityId: supplier.id });
  revalidatePath("/admin/suppliers");
}

export async function updateSupplier(id: string, data: SupplierInput) {
  const user = await requirePermission("suppliers.update");
  await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, taxId: data.taxId || null,
      wilayaId: data.wilayaId ?? null, communeId: data.communeId ?? null, isActive: data.isActive,
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "suppliers", entityId: id });
  revalidatePath("/admin/suppliers");
}

export async function deleteSupplier(id: string) {
  const user = await requirePermission("suppliers.delete");

  // Check for related records
  const [purchases, payments] = await Promise.all([
    prisma.purchase.count({ where: { supplierId: id } }),
    prisma.paymentSupplier.count({ where: { supplierId: id } }),
  ]);

  const related: string[] = [];
  if (purchases > 0) related.push(`${purchases} achat(s)`);
  if (payments > 0) related.push(`${payments} paiement(s fournisseur)`);

  if (related.length > 0) {
    throw new Error(`Ce fournisseur ne peut pas être supprimé. Il est lié à : ${related.join(", ")}.`);
  }

  await prisma.supplier.delete({ where: { id } });
  await logActivity({ userId: user.id, action: "deleted", entity: "suppliers", entityId: id });
  revalidatePath("/admin/suppliers");
}