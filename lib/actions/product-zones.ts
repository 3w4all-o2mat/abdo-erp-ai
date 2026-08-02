"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createProductZone(data: { name: string; isActive?: boolean }) {
  const user = await requirePermission("product_zones.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  const zone = await prisma.productZone.create({
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({ userId: user.id, action: "created", entity: "product_zones", entityId: zone.id });
  revalidatePath("/admin/product-zones");
  revalidatePath("/admin/product-marques-maison");
}

export async function updateProductZone(
  id: string,
  data: { name: string; isActive?: boolean },
) {
  const user = await requirePermission("product_zones.manage");
  const name = data.name.trim();
  if (!name) throw new Error("Le nom est requis");
  await prisma.productZone.update({
    where: { id },
    data: { name, isActive: data.isActive ?? true },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "product_zones", entityId: id });
  revalidatePath("/admin/product-zones");
  revalidatePath("/admin/product-marques-maison");
}

export async function deleteProductZone(id: string) {
  const user = await requirePermission("product_zones.manage");
  const marquesCount = await prisma.productMarqueMaison.count({ where: { zoneId: id } });
  if (marquesCount > 0) {
    throw new Error(
      `Impossible de supprimer cette zone : ${marquesCount} marque(s) maison y sont encore liées. Déplacez ou supprimez ces marques d'abord.`,
    );
  }
  await prisma.productZone.delete({ where: { id } });
  await logActivity({ userId: user.id, action: "deleted", entity: "product_zones", entityId: id });
  revalidatePath("/admin/product-zones");
  revalidatePath("/admin/product-marques-maison");
}
