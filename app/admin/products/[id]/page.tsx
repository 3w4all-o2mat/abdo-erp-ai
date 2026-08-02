export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { ProductFormDialog } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getCompanyCurrency } from "@/lib/settings";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("products.update");
  const [product, categories, prices, currency, moteurs, marquesFiltres, marquesMaisons] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        currentPrice: true,
        marquesMaisons: { include: { marqueMaison: { select: { id: true, name: true } } } },
      },
    }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.productPrice.findMany({ where: { productId: id }, orderBy: { effectiveDate: "desc" } }),
    getCompanyCurrency(),
    prisma.productMoteur.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productMarqueFiltre.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productMarqueMaison.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) return <p>Produit introuvable</p>;

  // Serialize Decimal/Date fields so the object can cross the RSC -> Client boundary.
  // Prisma `Decimal` is a class instance and cannot be passed to Client Components.
  const serializedCurrentPrice = product.currentPrice
    ? { ...product.currentPrice, unitPrice: product.currentPrice.unitPrice.toNumber() }
    : undefined;
  const serializedProduct = {
    ...product,
    costPrice: product.costPrice.toNumber(),
    // Override the nested `currentPrice` relation too, otherwise the spread keeps
    // the original Prisma object (with its Decimal unitPrice) and the whole
    // `product` prop still fails to serialize.
    currentPrice: serializedCurrentPrice ?? null,
  };
  const initialMarqueMaisonIds = product.marquesMaisons.map((mm) => mm.marqueMaison.id);

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description={`SKU: ${product.sku}`}>
        <Button asChild variant="outline"><Link href="/admin/products"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {product.image ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed bg-muted text-sm text-muted-foreground">
                Aucune photo
              </div>
            )}
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="font-medium">{product.name}</dd>
              </div>
              {product.displayName ? (
                <div>
                  <dt className="text-muted-foreground">Nom affiché</dt>
                  <dd className="font-medium">{product.displayName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">SKU</dt>
                <dd className="font-medium">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Code-barres</dt>
                <dd className="font-medium">{product.barcode || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Catégorie</dt>
                <dd className="font-medium">{product.category.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unité</dt>
                <dd className="font-medium">{product.unitOfMeasure}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Statut</dt>
                <dd className="font-medium">
                  {product.isActive ? "Actif" : "Inactif"}
                  {product.isStockable ? " · Stockable" : " · Non stockable"}
                </dd>
              </div>
              {product.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="whitespace-pre-line font-medium">{product.description}</dd>
                </div>
              ) : null}
            </dl>
            <div className="pt-2">
              <ProductFormDialog
                product={serializedProduct}
                categories={categories}
                currentPrice={serializedCurrentPrice}
                moteurs={moteurs}
                marquesFiltres={marquesFiltres}
                marquesMaisons={marquesMaisons}
                initialMoteurId={product.moteurId}
                initialMarqueFiltreId={product.marqueFiltreId}
                initialMarqueMaisonIds={initialMarqueMaisonIds}
                trigger={<Button>Modifier</Button>}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historique des prix</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Prix</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {prices.map((p) => (
                  <TableRow key={p.id}><TableCell>{formatMoney(p.unitPrice.toNumber(), currency)}</TableCell><TableCell>{formatDate(p.effectiveDate)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
