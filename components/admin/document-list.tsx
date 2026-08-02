"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { confirmDocument, cancelDocument, deleteRecord } from "@/lib/actions";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import { useSettingsCurrency } from "@/components/providers/settings-provider";
import { Settings, Pencil, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type DocRow = {
  id: string; reference: string; date: Date; status: string;
  partnerName: string; total: number;
};

export function DocumentList({
  rows, newHref, entity, title, countLabel, searchPlaceholder, newLabel = "Nouveau", statusFilter,
}: {
  rows: DocRow[];
  newHref: string;
  entity: "quotations" | "orders" | "invoices" | "purchases";
  title: string;
  countLabel: string;
  searchPlaceholder: string;
  newLabel?: string;
  statusFilter?: { options: { value: string; label: string }[]; placeholder?: string };
}) {
  const [filteredCount, setFilteredCount] = React.useState<number | null>(null);
  // countLabel is expected to contain a single "N label" pair. If it does, we replace N with the filtered count.
  const match = countLabel.match(/^(\d+)\s+(.+)$/);
  const displayCount = filteredCount !== null && match ? `${filteredCount} ${match[2]}` : countLabel;
  const editBase = `/admin/${entity === "quotations" ? "quotations" : entity === "orders" ? "orders" : entity === "invoices" ? "invoices" : "purchases"}`;
  const deletePerm = `${entity === "quotations" ? "quotations" : entity === "orders" ? "orders" : entity === "invoices" ? "invoices" : "purchases"}.delete`;
  const currency = useSettingsCurrency();

  const columns: Column<DocRow>[] = [
    { key: "reference", header: "Référence", sortable: true, sortValue: (r) => r.reference, width: "minmax(120px, 1.5fr)", cell: (r) => <Link href={`${editBase}/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.reference}</Link> },
    { key: "partnerName", header: entity === "purchases" ? "Fournisseur" : "Client", sortable: true, sortValue: (r) => r.partnerName, width: "minmax(100px, 1fr)", cell: (r) => r.partnerName },
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), className: "text-center", width: "120px", cell: (r) => formatDate(r.date) },
    { key: "total", header: "Total TTC", sortable: true, sortValue: (r) => r.total, className: "text-right", width: "140px", cell: (r) => <span className="font-medium">{formatMoney(r.total, currency)}</span> },
    { key: "status", header: "Statut", className: "text-center", width: "120px", cell: (r) => <div className="flex justify-center"><StatusBadge status={r.status} /></div> },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><Settings className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href={`${editBase}/${r.id}`}><Eye className="h-4 w-4" /> Voir / Modifier</Link></DropdownMenuItem>
            {r.status === "draft" && (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ConfirmDialog title="Confirmer ce document ?" description="Les mouvements de stock seront écrits." confirmLabel="Confirmer" variant="success" onConfirm={() => confirmDocument(entity, r.id)}>
                  <span className="flex items-center gap-2 text-success"><CheckCircle2 className="h-4 w-4" /> Confirmer</span>
                </ConfirmDialog>
              </DropdownMenuItem>
            )}
            {r.status === "confirmed" && (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ConfirmDialog title="Annuler ce document ?" description="Les mouvements de stock seront contre-passés." confirmLabel="Annuler le document" onConfirm={() => cancelDocument(entity, r.id)}>
                  <span className="flex items-center gap-2 text-destructive"><XCircle className="h-4 w-4" /> Annuler</span>
                </ConfirmDialog>
              </DropdownMenuItem>
            )}
            {r.status === "draft" && (
              <ConfirmDialog title="Supprimer ce document ?" description="Cette action est irréversible." onConfirm={() => deleteRecord(entity, r.id, deletePerm)}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
              </ConfirmDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{displayCount}</p>
        </div>
        <Button asChild><Link href={`${newHref}`}>{newLabel}</Link></Button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={["reference", "partnerName"]}
        searchPlaceholder={searchPlaceholder}
        statusFilter={statusFilter}
        onCountChange={setFilteredCount}
        defaultSort={{ key: "reference", dir: "desc" }}
        footer={(visibleRows) => {
          const total = visibleRows.reduce((sum, r) => sum + r.total, 0);
          return (
            <tr>
              {columns.map((c) => {
                if (c.key === "total") {
                  return <td key={c.key} className={cn("text-right text-foreground", c.className)}><span className="font-semibold">{formatMoney(total, currency)}</span></td>;
                }
                if (c.key === "actions") {
                  return <td key={c.key} className={c.className} />;
                }
                return <td key={c.key} className={cn("text-muted-foreground", c.className)} />;
              })}
            </tr>
          );
        }}
      />
    </div>
  );
}