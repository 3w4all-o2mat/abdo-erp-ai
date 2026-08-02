"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  /** CSS grid-template-columns value for this column, e.g. "2fr", "150px". */
  width?: string;
};

export type StatusFilterOption = { value: string; label: string };

export type DataTableSort = { key: string; dir: "asc" | "desc" };

export type EntityFilter<T> = {
  /** Key on the row used for equality filtering (stringified on both sides). */
  key: keyof T;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function DataTable<T extends { id: string; status?: string }>({
  columns, rows, searchKeys, searchPlaceholder = "Rechercher...", pageSize = 10, emptyMessage = "Aucune donnée", statusFilter, entityFilter, onCountChange, defaultSort, footer,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  statusFilter?: { options: StatusFilterOption[]; placeholder?: string };
  entityFilter?: EntityFilter<T>;
  onCountChange?: (count: number) => void;
  defaultSort?: DataTableSort;
  footer?: (rows: T[]) => React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [entity, setEntity] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<DataTableSort | null>(defaultSort ?? null);

  const filtered = React.useMemo(() => {
    let result = rows;
    if (statusFilter && status !== "all") {
      result = result.filter((r) => r.status === status);
    }
    if (entityFilter && entity !== "all") {
      const key = entityFilter.key;
      result = result.filter((r) => String(r[key] ?? "") === entity);
    }
    if (query && searchKeys) {
      const q = query.toLowerCase();
      result = result.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
    }
    return result;
  }, [rows, query, searchKeys, status, statusFilter, entityFilter, entity]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    // If we're not sorting by date, use the date column as a stable tiebreaker
    // so rows with the same primary key are still ordered most-recent-first.
    const tiebreaker = sort.key !== "date" ? columns.find((c) => c.key === "date") : undefined;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      if (tiebreaker?.sortValue) {
        const ta = tiebreaker.sortValue(a);
        const tb = tiebreaker.sortValue(b);
        if (ta < tb) return 1; // newest date first
        if (ta > tb) return -1;
      }
      return 0;
    });
    return copy;
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  // Build column widths (used for both th and td via inline style)
  const columnWidths = columns.map((c) => c.width);

  React.useEffect(() => {
    onCountChange?.(sorted.length);
  }, [sorted.length, onCountChange]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="space-y-3">
      {(searchKeys || statusFilter || entityFilter) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center">
          {statusFilter && (
            <Select value={status === "all" ? "" : status} onValueChange={(v) => { setStatus(v || "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={statusFilter.placeholder ?? "Statut"} />
              </SelectTrigger>
              <SelectContent>
                {statusFilter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {entityFilter && (
            <Select value={entity === "all" ? "" : entity} onValueChange={(v) => { setEntity(v || "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={entityFilter.placeholder ?? "Filtrer"} />
              </SelectTrigger>
              <SelectContent>
                {entityFilter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {searchKeys && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="pl-9" />
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="odoo-grid">
            <colgroup>
              {columnWidths.map((w, i) => (
                <col key={i} style={w ? { width: w } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={c.className} style={c.width ? { width: c.width } : undefined}>
                    {c.sortable ? (
                      <button onClick={() => toggleSort(c.key)}>
                        {c.header}
                        {sort?.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={columns.length} className="odoo-empty">{emptyMessage}</td></tr>
              )}
              {pageRows.map((row, idx) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.className} style={c.width ? { width: c.width } : undefined}>{c.cell(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer && sorted.length > 0 && (
              <tfoot>
                {footer(sorted)}
              </tfoot>
            )}
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} résultat(s) · Page {current} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}