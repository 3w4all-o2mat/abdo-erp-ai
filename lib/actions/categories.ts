"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createCategory(data: { name: string; parentId?: string | null }) {
  const user = await requirePermission("categories.manage");
  const cat = await prisma.productCategory.create({ data: { name: data.name, parentId: data.parentId || null } });
  await logActivity({ userId: user.id, action: "created", entity: "product_categories", entityId: cat.id });
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, data: { name: string; parentId?: string | null }) {
  const user = await requirePermission("categories.manage");
  await prisma.productCategory.update({ where: { id }, data: { name: data.name, parentId: data.parentId || null } });
  await logActivity({ userId: user.id, action: "updated", entity: "product_categories", entityId: id });
  revalidatePath("/admin/categories");
}