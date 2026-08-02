"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { nextReference } from "@/lib/actions";
import { revalidatePath } from "next/cache";

type TransferInput = {
  fromStockId: string; toStockId: string; date: Date;
  lines: { productId: string; qty: number }[];
};

export async function createTransfer(data: TransferInput) {
  const user = await requirePermission("stock_transfers.create");
  const reference = await nextReference("stock_transfers");
  const doc = await prisma.stockTransfer.create({
    data: {
      reference, date: data.date, fromStockId: data.fromStockId, toStockId: data.toStockId, userId: user.id, status: "draft",
      lines: { create: data.lines.map((l) => ({ productId: l.productId, qty: l.qty })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "stock_transfers", entityId: doc.id });
  revalidatePath("/admin/stock-transfers");
  return doc.id;
}

type AdjustmentInput = {
  stockId: string; date: Date; reason?: string;
  lines: { productId: string; qtySigned: number }[];
};

export async function createAdjustment(data: AdjustmentInput) {
  const user = await requirePermission("stock_adjustments.create");
  const reference = await nextReference("stock_adjustments");
  const doc = await prisma.stockAdjustment.create({
    data: {
      reference, date: data.date, stockId: data.stockId, userId: user.id, reason: data.reason || null, status: "draft",
      lines: { create: data.lines.map((l) => ({ productId: l.productId, qtySigned: l.qtySigned })) },
    },
  });
  await logActivity({ userId: user.id, action: "created", entity: "stock_adjustments", entityId: doc.id });
  revalidatePath("/admin/stock-adjustments");
  return doc.id;
}