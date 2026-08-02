"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createProductMarqueFiltre(data: { name: string; isActive?: boolean }) {
  const user = await requirePermission("product_marques_filtre.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const marque = await prisma.productMarqueFiltre.create({
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "created",
    entity: "product_marques_filtre",
    entityId: marque.id,
  });
  revalidatePath("/admin/product-marques-filtre");
}

export async function updateProductMarqueFiltre(
  id: string,
  data: { name: string; isActive?: boolean },
) {
  const user = await requirePermission("product_marques_filtre.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.productMarqueFiltre.update({
    where: { id },
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "product_marques_filtre",
    entityId: id,
  });
  revalidatePath("/admin/product-marques-filtre");
}

export async function deleteProductMarqueFiltre(id: string) {
  const user = await requirePermission("product_marques_filtre.manage");
  const productsCount = await prisma.product.count({ where: { marqueFiltreId: id } });
  if (productsCount > 0) {
    throw new Error(
      `Impossible de supprimer cette marque de filtre : ${productsCount} produit(s) y sont encore liés. Réassignez ces produits d'abord.`,
    );
  }
  await prisma.productMarqueFiltre.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: "deleted",
    entity: "product_marques_filtre",
    entityId: id,
  });
  revalidatePath("/admin/product-marques-filtre");
}
