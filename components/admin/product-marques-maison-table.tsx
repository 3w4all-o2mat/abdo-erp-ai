"use client";
import * as React from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ProductMarqueMaisonActions } from "@/components/admin/product-marque-maison-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProductZone } from "@prisma/client";

export interface ProductMarqueMaisonRow {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  isActive: boolean;
  productsCount: number;
}

export function ProductMarquesMaisonTable({
  rows, zones,
}: {
  rows: ProductMarqueMaisonRow[];
  zones: ProductZone[];
}) {
  const columns: Column<ProductMarqueMaisonRow>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Nom",
        sortable: true,
        sortValue: (r) => r.name.toLowerCase(),
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: "zoneName",
        header: "Zone",
        sortable: true,
        sortValue: (r) => r.zoneName.toLowerCase(),
        cell: (r) => <span className="text-muted-foreground">{r.zoneName || "—"}</span>,
      },
      {
        key: "productsCount",
        header: "Produits",
        sortable: true,
        sortValue: (r) => r.productsCount,
        className: "text-center",
        cell: (r) => (
          <span className="text-muted-foreground">
            {r.productsCount} produit{r.productsCount > 1 ? "s" : ""}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Statut",
        sortable: true,
        sortValue: (r) => (r.isActive ? 1 : 0),
        className: "text-center",
        cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-center",
        width: "80px",
        cell: (r) => (
          <ProductMarqueMaisonActions
            marque={{ id: r.id, name: r.name, zoneId: r.zoneId, isActive: r.isActive }}
            zones={zones}
            productsCount={r.productsCount}
          />
        ),
      },
    ],
    [zones],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchKeys={["name", "zoneName"]}
      searchPlaceholder="Rechercher une marque maison..."
      pageSize={20}
      emptyMessage="Aucune marque maison. Cliquez sur « Nouvelle marque maison » pour commencer."
    />
  );
}
