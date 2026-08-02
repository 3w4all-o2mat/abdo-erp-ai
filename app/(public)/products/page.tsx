import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { getCompanyCurrency } from "@/lib/settings";
import { Package } from "lucide-react";

export default async function ProductsPage() {
  const [products, categories, currency] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true, category: true }, orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    getCompanyCurrency(),
  ]);

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nos produits</h1>
        <p className="text-muted-foreground mt-1">{products.length} produit(s) disponible(s)</p>
      </div>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Badge variant="default">Tous</Badge>
          {categories.map((c) => <Badge key={c.id} variant="secondary">{c.name}</Badge>)}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <Card key={p.id} className="card-hover overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
              <Package className="h-14 w-14 text-primary/40" />
            </div>
            <CardContent className="p-4">
              <Badge variant="secondary" className="text-[10px] mb-2">{p.category?.name ?? "Général"}</Badge>
              <p className="font-medium truncate">{p.displayName ?? p.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
              {p.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              <p className="mt-2 font-bold text-primary text-lg">{formatMoney(p.currentPrice?.unitPrice.toNumber() ?? 0, currency)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}