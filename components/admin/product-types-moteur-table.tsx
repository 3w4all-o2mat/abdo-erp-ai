"use client";
import * as React from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ProductTypeMoteurActions } from "@/components/admin/product-type-moteur-actions";
import { StatusBadge } from "@/components/ui/status-badge";

export interface ProductTypeMoteurRow {
  id: string;
  name: string;
  isActive: boolean;
}

export function ProductTypesMoteurTable({ rows }: { rows: ProductTypeMoteurRow[] }) {
  const columns: Column<ProductTypeMoteurRow>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Nom",
        sortable: true,
        sortValue: (r) => r.name.toLowerCase(),
        cell: (r) => <span className="font-medium">{r.name}</span>,
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
          <ProductTypeMoteurActions
            type={{ id: r.id, name: r.name, isActive: r.isActive }}
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
      searchPlaceholder="Rechercher un type de moteur..."
      pageSize={20}
      emptyMessage="Aucun type de moteur. Cliquez sur « Nouveau type de moteur » pour commencer."
    />
  );
}
