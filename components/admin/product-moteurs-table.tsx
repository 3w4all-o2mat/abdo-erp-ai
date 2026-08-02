"use client";
import * as React from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ProductMoteurActions } from "@/components/admin/product-moteur-actions";
import { StatusBadge } from "@/components/ui/status-badge";

export interface ProductMoteurRow {
  id: string;
  name: string;
  isActive: boolean;
  productsCount: number;
}

export function ProductMoteursTable({ rows }: { rows: ProductMoteurRow[] }) {
  const columns: Column<ProductMoteurRow>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Nom",
        sortable: true,
        sortValue: (r) => r.name.toLowerCase(),
        cell: (r) => <span className="font-medium">{r.name}</span>,
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
          <ProductMoteurActions
            moteur={{ id: r.id, name: r.name, isActive: r.isActive }}
            productsCount={r.productsCount}
          />
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchKeys={["name"]}
      searchPlaceholder="Rechercher un moteur..."
      pageSize={20}
      emptyMessage="Aucun moteur. Cliquez sur « Nouveau moteur » pour commencer."
    />
  );
}
