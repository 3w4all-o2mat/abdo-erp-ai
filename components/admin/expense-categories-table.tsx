"use client";
import * as React from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ExpenseCategoryActions } from "@/components/admin/expense-category-actions";
import { formatDate } from "@/lib/utils";

export interface ExpenseCategoryRow {
  id: string;
  name: string;
  createdAt: Date | string;
  expensesCount: number;
}

export function ExpenseCategoriesTable({ rows }: { rows: ExpenseCategoryRow[] }) {
  const columns: Column<ExpenseCategoryRow>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Nom",
        sortable: true,
        sortValue: (r) => r.name.toLowerCase(),
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: "expensesCount",
        header: "Dépenses",
        sortable: true,
        sortValue: (r) => r.expensesCount,
        className: "text-right",
        cell: (r) => (
          <span className="text-muted-foreground">
            {r.expensesCount} dépense{r.expensesCount > 1 ? "s" : ""}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "text-center",
        width: "48px",
        cell: (r) => <ExpenseCategoryActions category={{ id: r.id, name: r.name }} expensesCount={r.expensesCount} />,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchKeys={["name"]}
      searchPlaceholder="Rechercher une catégorie..."
      pageSize={20}
      emptyMessage="Aucune catégorie. Cliquez sur « Nouvelle catégorie » pour commencer."
    />
  );
}
