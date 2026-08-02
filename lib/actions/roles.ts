"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createRole(data: { name: string; description?: string; permissionIds: string[] }) {
  const user = await requirePermission("roles.create");
  const role = await prisma.role.create({
    data: { name: data.name, description: data.description || null, permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) } },
  });
  await logActivity({ userId: user.id, action: "created", entity: "roles", entityId: role.id });
  revalidatePath("/admin/roles");
}

export async function updateRole(id: string, data: { name: string; description?: string; permissionIds: string[] }) {
  const user = await requirePermission("roles.update");
  await prisma.role.update({ where: { id }, data: { name: data.name, description: data.description || null } });
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  if (data.permissionIds.length) await prisma.rolePermission.createMany({ data: data.permissionIds.map((permissionId) => ({ roleId: id, permissionId })) });
  await logActivity({ userId: user.id, action: "updated", entity: "roles", entityId: id });
  revalidatePath("/admin/roles");
}