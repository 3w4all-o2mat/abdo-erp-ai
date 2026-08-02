"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createPaymentClient(data: {
  clientId: string; date: Date; amount: number; paymentMethod: string;
  orderId?: string | null; observation?: string;
}) {
  const user = await requirePermission("payments_clients.create");
  const p = await prisma.paymentClient.create({
    data: {
      clientId: data.clientId, date: data.date, amount: data.amount,
      paymentMethod: data.paymentMethod,
      orderId: data.orderId || null,
      observation: data.observation || null,
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "payments_clients", entityId: p.id });
  revalidatePath("/admin/payments/clients");
  if (data.orderId) revalidatePath(`/admin/orders/${data.orderId}`);
}

export async function createPaymentSupplier(data: {
  supplierId: string; date: Date; amount: number; paymentMethod: string;
  purchaseId?: string | null; observation?: string;
}) {
  const user = await requirePermission("payments_suppliers.create");
  const p = await prisma.paymentSupplier.create({
    data: { supplierId: data.supplierId, date: data.date, amount: data.amount, paymentMethod: data.paymentMethod, purchaseId: data.purchaseId || null, observation: data.observation || null },
  });
  await logActivity({ userId: user.id, action: "created", entity: "payments_suppliers", entityId: p.id });
  revalidatePath("/admin/payments/suppliers");
}

export async function createExpense(data: {
  expenseCategoryId: string; date: Date; amount: number; observation?: string;
}) {
  const user = await requirePermission("expenses.create");
  const e = await prisma.expense.create({
    data: { expenseCategoryId: data.expenseCategoryId, date: data.date, amount: data.amount, observation: data.observation || null },
  });
  await logActivity({ userId: user.id, action: "created", entity: "expenses", entityId: e.id });
  revalidatePath("/admin/expenses");
}