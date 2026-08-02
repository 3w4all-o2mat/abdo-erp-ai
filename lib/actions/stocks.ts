"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createStock(data: { name: string; address?: string; isDefault?: boolean }) {
  const user = await requirePermission("stocks.manage");
  if (data.isDefault) await prisma.stock.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  const stock = await prisma.stock.create({ data: { name: data.name, address: data.address || null, isDefault: data.isDefault ?? false } });
  await logActivity({ userId: user.id, action: "created", entity: "stocks", entityId: stock.id });
  revalidatePath("/admin/stocks");
}

export async function updateStock(id: string, data: { name: string; address?: string; isDefault?: boolean }) {
  const user = await requirePermission("stocks.manage");
  if (data.isDefault) await prisma.stock.updateMany({ where: { isDefault: true, NOT: { id } }, data: { isDefault: false } });
  await prisma.stock.update({ where: { id }, data: { name: data.name, address: data.address || null, isDefault: data.isDefault ?? false } });
  await logActivity({ userId: user.id, action: "updated", entity: "stocks", entityId: id });
  revalidatePath("/admin/stocks");
}