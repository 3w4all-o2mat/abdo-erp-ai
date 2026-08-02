"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createProductTypeMoteur(data: { name: string; isActive?: boolean }) {
  const user = await requirePermission("product_types_moteur.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const type = await prisma.productTypeMoteur.create({
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "created",
    entity: "product_types_moteur",
    entityId: type.id,
  });
  revalidatePath("/admin/product-types-moteur");
  revalidatePath("/admin/product-moteurs");
}

export async function updateProductTypeMoteur(
  id: string,
  data: { name: string; isActive?: boolean },
) {
  const user = await requirePermission("product_types_moteur.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.productTypeMoteur.update({
    where: { id },
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "product_types_moteur",
    entityId: id,
  });
  revalidatePath("/admin/product-types-moteur");
  revalidatePath("/admin/product-moteurs");
}

export async function deleteProductTypeMoteur(id: string) {
  const user = await requirePermission("product_types_moteur.manage");
  await prisma.productTypeMoteur.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: "deleted",
    entity: "product_types_moteur",
    entityId: id,
  });
  revalidatePath("/admin/product-types-moteur");
  revalidatePath("/admin/product-moteurs");
}
