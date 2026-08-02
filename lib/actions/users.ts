"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  username: string; password: string; fullName: string; email?: string; phone?: string;
  defaultStockId?: string | null; isActive: boolean; roleIds: string[]; stockIds: string[];
}) {
  const user = await requirePermission("users.create");
  const hashed = await bcrypt.hash(data.password, 12);
  const u = await prisma.user.create({
    data: {
      username: data.username, password: hashed, fullName: data.fullName,
      email: data.email || null, phone: data.phone || null,
      defaultStockId: data.defaultStockId || null, isActive: data.isActive,
      roles: { create: data.roleIds.map((roleId) => ({ roleId })) },
      stockUsers: { create: data.stockIds.map((stockId) => ({ stockId })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "users", entityId: u.id });
  revalidatePath("/admin/users");
}

export async function updateUser(id: string, data: {
  username: string; password?: string; fullName: string; email?: string; phone?: string;
  defaultStockId?: string | null; isActive: boolean; roleIds: string[]; stockIds: string[];
}) {
  const user = await requirePermission("users.update");
  const update: Record<string, unknown> = {
    username: data.username, fullName: data.fullName, email: data.email || null,
    phone: data.phone || null, defaultStockId: data.defaultStockId || null, isActive: data.isActive,
  };
  if (data.password) update.password = await bcrypt.hash(data.password, 12);
  await prisma.user.update({ where: { id }, data: update });
  await prisma.userRole.deleteMany({ where: { userId: id } });
  if (data.roleIds.length) await prisma.userRole.createMany({ data: data.roleIds.map((roleId) => ({ userId: id, roleId })) });
  await prisma.stockUser.deleteMany({ where: { userId: id } });
  if (data.stockIds.length) await prisma.stockUser.createMany({ data: data.stockIds.map((stockId) => ({ userId: id, stockId })) });
  await logActivity({ userId: user.id, action: "updated", entity: "users", entityId: id });
  revalidatePath("/admin/users");
}