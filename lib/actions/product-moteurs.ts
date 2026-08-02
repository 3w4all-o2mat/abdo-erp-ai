"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createProductMoteur(data: {
  name: string;
  isActive?: boolean;
}) {
  const user = await requirePermission("product_moteurs.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const moteur = await prisma.productMoteur.create({
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "created",
    entity: "product_moteurs",
    entityId: moteur.id,
  });
  revalidatePath("/admin/product-moteurs");
}

export async function updateProductMoteur(
  id: string,
  data: { name: string; isActive?: boolean },
) {
  const user = await requirePermission("product_moteurs.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.productMoteur.update({
    where: { id },
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "product_moteurs",
    entityId: id,
  });
  revalidatePath("/admin/product-moteurs");
}

export async function deleteProductMoteur(id: string) {
  const user = await requirePermission("product_moteurs.manage");
  const productsCount = await prisma.product.count({ where: { moteurId: id } });
  if (productsCount > 0) {
    throw new Error(
      `Impossible de supprimer ce moteur : ${productsCount} produit(s) y sont encore liés. Réassignez ces produits d'abord.`,
    );
  }
  await prisma.productMoteur.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: "deleted",
    entity: "product_moteurs",
    entityId: id,
  });
  revalidatePath("/admin/product-moteurs");
}
