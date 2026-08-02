"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createProductMarqueMaison(data: {
  name: string;
  zoneId: string | null;
  isActive?: boolean;
}) {
  const user = await requirePermission("product_marques_maison.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const marque = await prisma.productMarqueMaison.create({
    data: { name, zoneId: data.zoneId || null, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "created",
    entity: "product_marques_maison",
    entityId: marque.id,
  });
  revalidatePath("/admin/product-marques-maison");
  revalidatePath("/admin/product-zones");
}

export async function updateProductMarqueMaison(
  id: string,
  data: { name: string; zoneId: string | null; isActive?: boolean },
) {
  const user = await requirePermission("product_marques_maison.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.productMarqueMaison.update({
    where: { id },
    data: { name, zoneId: data.zoneId || null, isActive: data.isActive ?? true },
  });
  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "product_marques_maison",
    entityId: id,
  });
  revalidatePath("/admin/product-marques-maison");
  revalidatePath("/admin/product-zones");
}

export async function deleteProductMarqueMaison(id: string) {
  const user = await requirePermission("product_marques_maison.manage");
  const productsCount = await prisma.product.count({
    where: { marquesMaisons: { some: { marqueMaison: { id } } } },
  });
  if (productsCount > 0) {
    throw new Error(
      `Impossible de supprimer cette marque maison : ${productsCount} produit(s) y sont encore liés. Retirez-la d'abord des produits concernés.`,
    );
  }
  await prisma.productMarqueMaison.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: "deleted",
    entity: "product_marques_maison",
    entityId: id,
  });
  revalidatePath("/admin/product-marques-maison");
  revalidatePath("/admin/product-zones");
}
