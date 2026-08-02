"use client";
import * as React from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ProductZoneActions } from "@/components/admin/product-zone-actions";
import { StatusBadge } from "@/components/ui/status-badge";

export interface ProductZoneRow {
  id: string;
  name: string;
  isActive: boolean;
  marquesCount: number;
}

export function ProductZonesTable({ rows }: { rows: ProductZoneRow[] }) {
  const columns: Column<ProductZoneRow>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Nom",
        sortable: true,
        sortValue: (r) => r.name.toLowerCase(),
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: "marquesCount",
        header: "Marques maison",
        sortable: true,
        sortValue: (r) => r.marquesCount,
        className: "text-center",
        cell: (r) => (
          <span className="text-muted-foreground">
            {r.marquesCount} marque{r.marquesCount > 1 ? "s" : ""}
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
          <ProductZoneActions
            zone={{ id: r.id, name: r.name, isActive: r.isActive }}
            marquesCount={r.marquesCount}
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
      searchPlaceholder="Rechercher une zone..."
      pageSize={20}
      emptyMessage="Aucune zone. Cliquez sur « Nouvelle zone » pour commencer."
      defaultSort={{ key: "marquesCount", dir: "desc" }}
    />
  );
}
