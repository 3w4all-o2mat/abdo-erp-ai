"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { nextReference } from "@/lib/actions";
import { revalidatePath } from "next/cache";

type LineInput = {
  productId: string; designation: string; qty: number; unitPrice: number;
  discountRate: number; vatRate: number; amount: number;
};

type DocInput = {
  reference?: string;
  date: Date;
  expiringDate?: Date | null;
  clientId?: string;
  supplierId?: string;
  stockId?: string;
  withTva?: boolean;
  withRemise?: boolean;
  remiseAmount?: number;
  htAmount?: number;
  tvaAmount?: number;
  ttcAmount?: number;
  lines: LineInput[];
};

// ── Quotations ──
export async function createQuotation(data: DocInput) {
  const user = await requirePermission("quotations.create");
  const reference = data.reference ?? (await nextReference("quotations"));
  const doc = await prisma.quotation.create({
    data: {
      reference, date: data.date, expiringDate: data.expiringDate ?? null,
      clientId: data.clientId!, userId: user.id, stockId: data.stockId!,
      withTva: data.withTva ?? true,
      withRemise: data.withRemise ?? true,
      remiseAmount: data.remiseAmount ?? 0,
      htAmount: data.htAmount ?? 0,
      tvaAmount: data.tvaAmount ?? 0,
      ttcAmount: data.ttcAmount ?? 0,
      lines: { create: data.lines.map((l) => ({ ...l, qty: l.qty, unitPrice: l.unitPrice, amount: l.amount })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "quotations", entityId: doc.id });
  revalidatePath("/admin/quotations");
  return doc.id;
}

export async function updateQuotation(id: string, data: DocInput) {
  const user = await requirePermission("quotations.update");
  await prisma.quotationLine.deleteMany({ where: { quotationId: id } });
  await prisma.quotation.update({
    where: { id },
    data: {
      date: data.date, expiringDate: data.expiringDate ?? null, clientId: data.clientId!, stockId: data.stockId!,
      withTva: data.withTva ?? true,
      withRemise: data.withRemise ?? true,
      remiseAmount: data.remiseAmount ?? 0,
      htAmount: data.htAmount ?? 0,
      tvaAmount: data.tvaAmount ?? 0,
      ttcAmount: data.ttcAmount ?? 0,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "quotations", entityId: id });
  revalidatePath("/admin/quotations");
}

// ── Orders ──
export async function createOrder(data: DocInput) {
  const user = await requirePermission("orders.create");
  const reference = data.reference ?? (await nextReference("orders"));
  const doc = await prisma.order.create({
    data: {
      reference, date: data.date, clientId: data.clientId!, userId: user.id, stockId: data.stockId!,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "orders", entityId: doc.id });
  revalidatePath("/admin/orders");
  return doc.id;
}

export async function updateOrder(id: string, data: DocInput) {
  const user = await requirePermission("orders.update");
  await prisma.orderLine.deleteMany({ where: { orderId: id } });
  await prisma.order.update({
    where: { id },
    data: {
      date: data.date, clientId: data.clientId!, stockId: data.stockId!,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "orders", entityId: id });
  revalidatePath("/admin/orders");
}

// ── Invoices ──
export async function createInvoice(data: DocInput & { orderId?: string | null }) {
  const user = await requirePermission("invoices.create");
  const reference = data.reference ?? (await nextReference("invoices"));
  const doc = await prisma.invoice.create({
    data: {
      reference, date: data.date, clientId: data.clientId!, userId: user.id, orderId: data.orderId ?? null,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "invoices", entityId: doc.id });
  revalidatePath("/admin/invoices");
  return doc.id;
}

export async function updateInvoice(id: string, data: DocInput & { orderId?: string | null }) {
  const user = await requirePermission("invoices.update");
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.update({
    where: { id },
    data: {
      date: data.date, clientId: data.clientId!, orderId: data.orderId ?? null,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "invoices", entityId: id });
  revalidatePath("/admin/invoices");
}

// ── Purchases ──
export async function createPurchase(data: DocInput) {
  const user = await requirePermission("purchases.create");
  const reference = data.reference ?? (await nextReference("purchases"));
  const doc = await prisma.purchase.create({
    data: {
      reference, date: data.date, supplierId: data.supplierId!, userId: user.id, stockId: data.stockId!,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "purchases", entityId: doc.id });
  revalidatePath("/admin/purchases");
  return doc.id;
}

export async function updatePurchase(id: string, data: DocInput) {
  const user = await requirePermission("purchases.update");
  await prisma.purchaseLine.deleteMany({ where: { purchaseId: id } });
  await prisma.purchase.update({
    where: { id },
    data: {
      date: data.date, supplierId: data.supplierId!, stockId: data.stockId!,
      lines: { create: data.lines.map((l) => ({ ...l })) },
    },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "purchases", entityId: id });
  revalidatePath("/admin/purchases");
}