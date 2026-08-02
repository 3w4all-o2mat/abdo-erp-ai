"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { generateReference } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/** Generate the next reference for a module and increment its counter. */
export async function nextReference(moduleSlug: string): Promise<string> {
  const mod = await prisma.module.findUnique({ where: { slug: moduleSlug } });
  if (!mod) throw new Error(`Module ${moduleSlug} introuvable`);
  const ref = generateReference(mod.namingDoc, mod.nextNumber);
  await prisma.module.update({ where: { id: mod.id }, data: { nextNumber: { increment: 1 } } });
  return ref;
}

/** Confirm a document and write stock movements (for orders/purchases/transfers/adjustments). */
export async function confirmDocument(entity: string, id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");

  const permMap: Record<string, string> = {
    quotations: "quotations.confirm", orders: "orders.confirm", invoices: "invoices.confirm",
    purchases: "purchases.confirm", stock_transfers: "stock_transfers.confirm", stock_adjustments: "stock_adjustments.confirm",
  };
  if (permMap[entity]) await requirePermission(permMap[entity]);

  if (entity === "orders") {
    const order = await prisma.order.findUnique({ where: { id }, include: { lines: true } });
    if (!order || order.status !== "draft") throw new Error("Commande non confirmable");
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: "confirmed" } });
      for (const line of order.lines) {
        await tx.stockMovement.create({
          data: {
            productId: line.productId, stockId: order.stockId, qtySigned: -line.qty,
            sourceType: "order", sourceId: order.id,
          },
        });
      }
      await logActivity({ userId: user.id, action: "confirmed", entity: "orders", entityId: id });
    });
  } else if (entity === "purchases") {
    const purchase = await prisma.purchase.findUnique({ where: { id }, include: { lines: true } });
    if (!purchase || purchase.status !== "draft") throw new Error("Achat non confirmable");
    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({ where: { id }, data: { status: "confirmed" } });
      for (const line of purchase.lines) {
        await tx.stockMovement.create({
          data: {
            productId: line.productId, stockId: purchase.stockId, qtySigned: line.qty,
            sourceType: "purchase", sourceId: purchase.id,
          },
        });
        // Update product cost price
        await tx.product.update({ where: { id: line.productId }, data: { costPrice: line.unitPrice } });
      }
      await logActivity({ userId: user.id, action: "confirmed", entity: "purchases", entityId: id });
    });
  } else if (entity === "quotations" || entity === "invoices") {
    await prisma.$transaction(async (tx) => {
      const model = entity === "quotations" ? tx.quotation : tx.invoice;
      // @ts-expect-error dynamic
      await model.update({ where: { id }, data: { status: "confirmed" } });
      await logActivity({ userId: user.id, action: "confirmed", entity, entityId: id });
    });
  } else if (entity === "stock_transfers") {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id }, include: { lines: true } });
    if (!transfer || transfer.status !== "draft") throw new Error("Transfert non confirmable");
    await prisma.$transaction(async (tx) => {
      await tx.stockTransfer.update({ where: { id }, data: { status: "confirmed" } });
      for (const line of transfer.lines) {
        await tx.stockMovement.create({ data: { productId: line.productId, stockId: transfer.fromStockId, qtySigned: -line.qty, sourceType: "transfer", sourceId: transfer.id } });
        await tx.stockMovement.create({ data: { productId: line.productId, stockId: transfer.toStockId, qtySigned: line.qty, sourceType: "transfer", sourceId: transfer.id } });
      }
      await logActivity({ userId: user.id, action: "confirmed", entity: "stock_transfers", entityId: id });
    });
  } else if (entity === "stock_adjustments") {
    const adj = await prisma.stockAdjustment.findUnique({ where: { id }, include: { lines: true } });
    if (!adj || adj.status !== "draft") throw new Error("Ajustement non confirmable");
    await prisma.$transaction(async (tx) => {
      await tx.stockAdjustment.update({ where: { id }, data: { status: "confirmed" } });
      for (const line of adj.lines) {
        await tx.stockMovement.create({ data: { productId: line.productId, stockId: adj.stockId, qtySigned: line.qtySigned, sourceType: "adjustment", sourceId: adj.id } });
      }
      await logActivity({ userId: user.id, action: "confirmed", entity: "stock_adjustments", entityId: id });
    });
  }
  revalidatePath("/admin");
}

/** Cancel a document (and reverse stock movements if it was confirmed). */
export async function cancelDocument(entity: string, id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  const permMap: Record<string, string> = {
    quotations: "quotations.cancel", orders: "orders.cancel", invoices: "invoices.cancel",
    purchases: "purchases.cancel",
  };
  if (permMap[entity]) await requirePermission(permMap[entity]);

  const stockEntities = ["orders", "purchases", "stock_transfers", "stock_adjustments"];
  await prisma.$transaction(async (tx) => {
    if (stockEntities.includes(entity)) {
      // Reverse existing movements
      const movements = await tx.stockMovement.findMany({ where: { sourceType: entity === "stock_transfers" ? "transfer" : entity === "stock_adjustments" ? "adjustment" : entity, sourceId: id } });
      for (const m of movements) {
        await tx.stockMovement.create({ data: { productId: m.productId, stockId: m.stockId, qtySigned: -m.qtySigned, sourceType: "adjustment", sourceId: `cancel-${id}` } });
      }
    }
    const model = entity === "quotations" ? tx.quotation : entity === "orders" ? tx.order : entity === "invoices" ? tx.invoice : entity === "purchases" ? tx.purchase : entity === "stock_transfers" ? tx.stockTransfer : tx.stockAdjustment;
    // @ts-expect-error dynamic
    await model.update({ where: { id }, data: { status: "canceled" } });
    await logActivity({ userId: user.id, action: "canceled", entity, entityId: id });
  });
  revalidatePath("/admin");
}

/** Generic delete with audit log + permission check. */
export async function deleteRecord(entity: string, id: string, permission: string) {
  await requirePermission(permission);
  const user = await getCurrentUser();
  const modelMap: Record<string, keyof typeof prisma> = {
    clients: "client", suppliers: "supplier", products: "product", product_categories: "productCategory",
    stocks: "stock", users: "user", roles: "role", expenses: "expense", expense_categories: "expenseCategory",
    payments_clients: "paymentClient", payments_suppliers: "paymentSupplier",
    quotations: "quotation", orders: "order", invoices: "invoice", purchases: "purchase",
    product_zones: "productZone", product_marques_maison: "productMarqueMaison",
    product_moteurs: "productMoteur", product_types_moteur: "productTypeMoteur",
    product_marques_filtre: "productMarqueFiltre",
  };
  const model = modelMap[entity] as keyof typeof prisma;
  // @ts-expect-error dynamic
  await prisma[model].delete({ where: { id } });
  await logActivity({ userId: user!.id, action: "deleted", entity, entityId: id });
  revalidatePath("/admin");
}