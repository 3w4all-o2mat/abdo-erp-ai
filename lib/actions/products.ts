"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { deleteUploadFile } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

type ProductInput = {
  sku: string; barcode?: string; name: string; displayName?: string;
  productCategoryId: string; unitOfMeasure: string; isStockable: boolean; isActive: boolean;
  costPrice: number; unitPrice: number; image?: string; description?: string;
  moteurId?: string | null;
  marqueFiltreId?: string | null;
  marquesMaisonIds?: string[];
  carburant?: string | null;
  age?: string | null;
  filterType?: string | null;
  referenceFilter?: string | null;
};

/** Normalize empty strings & unknown values to `null` for the new enum-as-string fields.
 *  Carburant, age, filterType are restricted to a known set; everything else becomes `null`. */
function normalizeEnum(value: string | null | undefined, allowed: readonly string[]): string | null {
  if (!value) return null;
  const v = String(value).trim();
  return v && allowed.includes(v) ? v : null;
}

const CARBURANT_VALUES = ["Essence", "Diesel"] as const;
const AGE_VALUES = ["Ancien", "Nouveau"] as const;
const FILTER_TYPE_VALUES = ["clim", "gazoil", "air", "essence", "huile"] as const;

export async function createProduct(data: ProductInput) {
  const user = await requirePermission("products.create");
  const product = await prisma.product.create({
    data: {
      sku: data.sku, barcode: data.barcode || null, name: data.name, displayName: data.displayName || null,
      productCategoryId: data.productCategoryId, unitOfMeasure: data.unitOfMeasure,
      isStockable: data.isStockable, isActive: data.isActive,
      costPrice: data.costPrice, image: data.image || null, description: data.description || null,
      moteurId: data.moteurId || null,
      marqueFiltreId: data.marqueFiltreId || null,
      carburant: normalizeEnum(data.carburant, CARBURANT_VALUES),
      age: normalizeEnum(data.age, AGE_VALUES),
      filterType: normalizeEnum(data.filterType, FILTER_TYPE_VALUES),
      referenceFilter: data.referenceFilter || null,
    },
  });
  if (data.marquesMaisonIds && data.marquesMaisonIds.length > 0) {
    await prisma.productsMarquesMaison.createMany({
      data: data.marquesMaisonIds.map((marqueMaisonId) => ({ productId: product.id, productMarqueMaisonId: marqueMaisonId })),
    });
  }
  const price = await prisma.productPrice.create({
    data: { productId: product.id, name: "Prix standard", unitPrice: data.unitPrice },
  });
  await prisma.product.update({ where: { id: product.id }, data: { currentPriceId: price.id } });
  await logActivity({ userId: user.id, action: "created", entity: "products", entityId: product.id });
  revalidatePath("/admin/products");
}

export async function updateProduct(id: string, data: ProductInput) {
  const user = await requirePermission("products.update");
  // Look up the existing image so we can clean up the previous upload from
  // disk once the new value is committed. This runs before the transaction
  // because the previous URL is read-only and stable.
  const previous = await prisma.product.findUnique({ where: { id }, select: { image: true } });
  const newImage = data.image || null;
  await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: {
        sku: data.sku, barcode: data.barcode || null, name: data.name, displayName: data.displayName || null,
        productCategoryId: data.productCategoryId, unitOfMeasure: data.unitOfMeasure,
        isStockable: data.isStockable, isActive: data.isActive,
        costPrice: data.costPrice, image: newImage, description: data.description || null,
        moteurId: data.moteurId || null,
        marqueFiltreId: data.marqueFiltreId || null,
        carburant: normalizeEnum(data.carburant, CARBURANT_VALUES),
        age: normalizeEnum(data.age, AGE_VALUES),
        filterType: normalizeEnum(data.filterType, FILTER_TYPE_VALUES),
        referenceFilter: data.referenceFilter || null,
      },
    }),
    prisma.productsMarquesMaison.deleteMany({ where: { productId: id } }),
    ...((data.marquesMaisonIds && data.marquesMaisonIds.length > 0)
      ? [prisma.productsMarquesMaison.createMany({
          data: data.marquesMaisonIds.map((marqueMaisonId) => ({ productId: id, productMarqueMaisonId: marqueMaisonId })),
        })]
      : []),
  ]);
  // After a successful commit, drop the previous file from the upload dir
  // if it was a local upload AND the user replaced or cleared it. Best-effort.
  if (previous?.image && previous.image !== newImage) {
    await deleteUploadFile(previous.image);
  }
  // Create a new price row if the price changed
  const current = await prisma.productPrice.findUnique({ where: { id: (await prisma.product.findUnique({ where: { id } }))?.currentPriceId ?? "" } });
  if (!current || current.unitPrice.toNumber() !== data.unitPrice) {
    const price = await prisma.productPrice.create({ data: { productId: id, name: "Prix standard", unitPrice: data.unitPrice } });
    await prisma.product.update({ where: { id }, data: { currentPriceId: price.id } });
  }
  await logActivity({ userId: user.id, action: "updated", entity: "products", entityId: id });
  revalidatePath("/admin/products");
}