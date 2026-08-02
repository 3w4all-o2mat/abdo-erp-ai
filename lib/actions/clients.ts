"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type ClientInput = {
  name: string; phone?: string; email?: string; address?: string; taxId?: string;
  wilayaId?: number | null; communeId?: number | null; isActive: boolean;
};

export async function createClient(data: ClientInput) {
  const user = await requirePermission("clients.create");
  const client = await prisma.client.create({
    data: {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, taxId: data.taxId || null,
      wilayaId: data.wilayaId ?? null, communeId: data.communeId ?? null, isActive: data.isActive,
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "clients", entityId: client.id });
  revalidatePath("/admin/clients");
}

export async function updateClient(id: string, data: ClientInput) {
  const user = await requirePermission("clients.update");
  await prisma.client.update({
    where: { id },
    data: {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, taxId: data.taxId || null,
      wilayaId: data.wilayaId ?? null, communeId: data.communeId ?? null, isActive: data.isActive,
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "clients", entityId: id });
  revalidatePath("/admin/clients");
}

export async function deleteClient(id: string) {
  const user = await requirePermission("clients.delete");

  // Check for related records
  const [quotations, orders, invoices, payments] = await Promise.all([
    prisma.quotation.count({ where: { clientId: id } }),
    prisma.order.count({ where: { clientId: id } }),
    prisma.invoice.count({ where: { clientId: id } }),
    prisma.paymentClient.count({ where: { clientId: id } }),
  ]);

  const related: string[] = [];
  if (quotations > 0) related.push(`${quotations} devis`);
  if (orders > 0) related.push(`${orders} commande(s)`);
  if (invoices > 0) related.push(`${invoices} facture(s)`);
  if (payments > 0) related.push(`${payments} paiement(s)`);

  if (related.length > 0) {
    throw new Error(`Ce client ne peut pas être supprimé. Il est lié à : ${related.join(", ")}.`);
  }

  await prisma.client.delete({ where: { id } });
  await logActivity({ userId: user.id, action: "deleted", entity: "clients", entityId: id });
  revalidatePath("/admin/clients");
}