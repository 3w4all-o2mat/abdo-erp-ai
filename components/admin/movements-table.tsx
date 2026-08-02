"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { EmptyState } from "@/components/admin/empty-state";
import { cn, formatDateTime, formatNumber, dayKey, weekKey, monthKey, yearKey, formatGroupLabel } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Inbox,
} from "lucide-react";

const PAGE_SIZE = 50;

export type GroupBy = "none" | "product" | "stock" | "day" | "week" | "month" | "year";

export interface MovementRow {
  id: string;
  date: Date;
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  stockId: string;
  stockName: string;
  qtySigned: number;
  sourceType: "order" | "purchase";
  sourceId: string;
  reference: string;
  userId: string;
  userName: string;
}

type DisplayRow =
  | { kind: "group"; key: string; label: string; count: number }
  | { kind: "row"; data: MovementRow }
  | { kind: "subtotal"; key: string; sum: number };

const GROUP_OPTIONS: SearchableOption[] = [
  { value: "none", label: "Aucun (tri par date)" },
  { value: "day", label: "Par jour" },
  { value: "week", label: "Par semaine" },
  { value: "month", label: "Par mois" },
  { value: "year", label: "Par année" },
  { value: "product", label: "Par produit" },
  { value: "stock", label: "Par stock" },
];

function groupKeyFor(row: MovementRow, groupBy: GroupBy): string {
  switch (groupBy) {
    case "product": return row.productId;
    case "stock": return row.stockId;
    case "day": return dayKey(row.date);
    case "week": return weekKey(row.date);
    case "month": return monthKey(row.date);
    case "year": return yearKey(row.date);
    default: return "";
  }
}

function labelFor(key: string, groupBy: GroupBy): string {
  if (groupBy === "product") {
    // Product labels are resolved at the call site because we need the product name.
    return key; // overwritten in caller
  }
  if (groupBy === "stock") return key; // overwritten in caller
  return formatGroupLabel(groupBy as "day" | "week" | "month" | "year", key);
}

export function MovementsTable({
  rows,
  stocks,
  products,
  users,
}: {
  rows: MovementRow[];
  stocks: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
  users: { id: string; label: string }[];
}) {
  const [stockId, setStockId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("none");
  const [page, setPage] = React.useState(1);

  const productById = React.useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const stockById = React.useMemo(
    () => new Map(stocks.map((s) => [s.id, s])),
    [stocks],
  );

  // Apply dropdown filters
  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (stockId && r.stockId !== stockId) return false;
      if (productId && r.productId !== productId) return false;
      if (userId && r.userId !== userId) return false;
      return true;
    });
  }, [rows, stockId, productId, userId]);

  // Sort + group. We always sort date desc within a group.
  const grouped = React.useMemo(() => {
    const copy = [...filtered].sort((a, b) => {
      if (groupBy !== "none") {
        const ka = groupKeyFor(a, groupBy);
        const kb = groupKeyFor(b, groupBy);
        if (ka < kb) return -1;
        if (ka > kb) return 1;
      }
      return b.date.getTime() - a.date.getTime();
    });

    if (groupBy === "none") return copy;

    // Build groups in the order they first appear
    const groupCounts = new Map<string, number>();
    const groupOrder: string[] = [];
    for (const r of copy) {
      const k = groupKeyFor(r, groupBy);
      if (!groupCounts.has(k)) {
        groupCounts.set(k, 0);
        groupOrder.push(k);
      }
      groupCounts.set(k, (groupCounts.get(k) ?? 0) + 1);
    }

    const flat: DisplayRow[] = [];
    let lastKey: string | null = null;
    let currentSum = 0;
    for (const r of copy) {
      const k = groupKeyFor(r, groupBy);
      if (k !== lastKey) {
        // Moving to a new group: flush the subtotal for the previous one.
        if (lastKey !== null) {
          flat.push({ kind: "subtotal", key: lastKey, sum: currentSum });
        }
        const rawLabel =
          groupBy === "product"
            ? productById.get(r.productId)?.name ?? r.productName
            : groupBy === "stock"
              ? stockById.get(r.stockId)?.name ?? r.stockName
              : labelFor(k, groupBy);
        flat.push({ kind: "group", key: k, label: rawLabel, count: groupCounts.get(k) ?? 0 });
        lastKey = k;
        currentSum = 0;
      }
      currentSum += r.qtySigned;
      flat.push({ kind: "row", data: r });
    }
    // Flush the final group's subtotal
    if (lastKey !== null) {
      flat.push({ kind: "subtotal", key: lastKey, sum: currentSum });
    }
    return flat;
  }, [filtered, groupBy, productById, stockById]);

  // Count of actual data rows. When groupBy === "none", `grouped` is a plain
  // array of MovementRow. Otherwise it's a DisplayRow[] with group headers.
  const dataRowCount = React.useMemo(() => {
    if (groupBy === "none") return (grouped as MovementRow[]).length;
    return (grouped as DisplayRow[]).reduce((acc, d) => acc + (d.kind === "row" ? 1 : 0), 0);
  }, [grouped, groupBy]);

  // Paginate: walk the grouped list, count only data rows, slice once we've
  // passed `pageSize` items. When groupBy === "none", `grouped` is a plain
  // array of MovementRow so we handle that case directly. When grouping is
  // active, we ensure the section header is always shown before the first
  // data row of its group on each page, even when a group spans the page
  // boundary.
  const pageSlice = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (groupBy === "none") {
      const arr = grouped as MovementRow[];
      return arr.slice(start, end) as unknown as DisplayRow[];
    }

    const arr = grouped as DisplayRow[];
    const slice: DisplayRow[] = [];
    let count = 0;
    let currentGroupHeader: DisplayRow | null = null;
    const emittedGroupKeys = new Set<string>();

    for (let i = 0; i < arr.length; i++) {
      const d = arr[i];
      if (!d) continue;
      if (d.kind === "group") {
        currentGroupHeader = d;
        // If the first data row of this group falls within the page, we will
        // emit the header alongside that row (handled below). We also emit it
        // directly when the group header itself lands inside the page.
        if (count >= start && count < end) {
          slice.push(d);
          emittedGroupKeys.add(d.key);
        }
        continue;
      }
      if (d.kind === "subtotal") {
        // Subtotals are never counted as data rows and are emitted inline
        // immediately after their group's last data row (handled below).
        continue;
      }
      if (count >= start && count < end) {
        // First visible row of its group? Emit the header too.
        if (currentGroupHeader && !emittedGroupKeys.has(currentGroupHeader.key)) {
          slice.push(currentGroupHeader);
          emittedGroupKeys.add(currentGroupHeader.key);
        }
        slice.push(d);
        // If the next item is this group's subtotal, keep it on the same page
        // so the sum always reflects the full group.
        const next = arr[i + 1];
        if (next && next.kind === "subtotal") {
          slice.push(next);
        }
      } else if (count >= end) {
        break;
      }
      count++;
    }
    return slice;
  }, [grouped, page, groupBy]);

  const totalPages = Math.max(1, Math.ceil(dataRowCount / PAGE_SIZE));
  const current = Math.min(page, totalPages);

  // Reset to page 1 whenever any filter changes
  React.useEffect(() => {
    setPage(1);
  }, [stockId, productId, userId, groupBy]);

  const hasFilters = !!(stockId || productId || userId || groupBy !== "none");

  function resetFilters() {
    setStockId("");
    setProductId("");
    setUserId("");
    setGroupBy("none");
  }

  // Dropdown options
  const stockOptions: SearchableOption[] = [
    { value: "", label: "Tous les stocks" },
    ...stocks.map((s) => ({ value: s.id, label: s.name })),
  ];
  const productOptions: SearchableOption[] = [
    { value: "", label: "Tous les produits" },
    ...products.map((p) => ({ value: p.id, label: p.name, search: p.sku })),
  ];
  const userOptions: SearchableOption[] = [
    { value: "", label: "Tous les vendeurs" },
    ...users.map((u) => ({ value: u.id, label: u.label })),
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock</label>
            <SearchableSelect
              value={stockId}
              onValueChange={setStockId}
              options={stockOptions}
              placeholder="Tous les stocks"
              clearable
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Produit</label>
            <SearchableSelect
              value={productId}
              onValueChange={setProductId}
              options={productOptions}
              placeholder="Tous les produits"
              searchPlaceholder="Rechercher un produit ou un SKU..."
              clearable
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Vendeur</label>
            <SearchableSelect
              value={userId}
              onValueChange={setUserId}
              options={userOptions}
              placeholder="Tous les vendeurs"
              clearable
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Grouper par</label>
            <SearchableSelect
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as GroupBy)}
              options={GROUP_OPTIONS}
              placeholder="Aucun (tri par date)"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Table or empty state */}
      {dataRowCount === 0 ? (
        <EmptyState
          icon={hasFilters ? Package : Inbox}
          title={hasFilters ? "Aucun mouvement ne correspond aux filtres" : "Aucun mouvement enregistré"}
          description={
            hasFilters
              ? "Essayez de retirer un filtre pour élargir les résultats."
              : "Les mouvements apparaîtront ici dès qu'une commande ou un achat sera confirmé."
          }
        />
      ) : (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Produit</th>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Stock</th>
                    <th className="h-11 px-4 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Quantité</th>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Vendeur</th>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Source</th>
                    <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((d, i) => {
                    // When groupBy === "none", pageSlice contains MovementRow directly.
                    if (groupBy === "none") {
                      const row = d as unknown as MovementRow;
                      return <DataRow key={row.id} row={row} />;
                    }
                    const item = d as DisplayRow;
                    if (item.kind === "group") {
                      return (
                        <tr key={`g-${item.key}-${i}`} className="bg-muted/40">
                          <td colSpan={7} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                              {item.label}
                              <span className="text-muted-foreground/60">· {item.count} mouvement{item.count > 1 ? "s" : ""}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    }
                    if (item.kind === "subtotal") {
                      const isPos = item.sum > 0;
                      const isNeg = item.sum < 0;
                      const absSum = Math.abs(item.sum);
                      return (
                        <tr key={`s-${item.key}-${i}`} className="bg-muted/60 border-t border-border/40">
                          <td colSpan={3} className="px-4 py-2 text-right align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Sous-total
                          </td>
                          <td
                            className={cn(
                              "p-4 align-middle text-right font-mono font-medium whitespace-nowrap",
                              isPos ? "text-success" : isNeg ? "text-destructive" : "text-muted-foreground",
                            )}
                          >
                            <span className="inline-flex items-center gap-1">
                              {isPos ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : isNeg ? (
                                <TrendingDown className="h-3.5 w-3.5" />
                              ) : null}
                              {isPos ? "+" : isNeg ? "−" : ""}
                              {formatNumber(absSum, 3)}
                            </span>
                          </td>
                          <td colSpan={3} className="p-4 align-middle" />
                        </tr>
                      );
                    }
                    return <DataRow key={item.data.id} row={item.data} />;
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {dataRowCount} mouvement(s) · Page {current} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DataRow({ row }: { row: MovementRow }) {
  const isEntry = row.qtySigned > 0; // purchases = entrées
  const absQty = Math.abs(row.qtySigned);
  const isOrder = row.sourceType === "order";
  const sourceHref = isOrder ? `/admin/orders/${row.sourceId}` : `/admin/purchases/${row.sourceId}`;

  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-muted/40">
      <td className="p-4 align-middle whitespace-nowrap text-muted-foreground">{formatDateTime(row.date)}</td>
      <td className="p-4 align-middle">
        <div>
          <p className="font-medium">{row.productName}</p>
          {row.productSku && <p className="text-xs text-muted-foreground font-mono">{row.productSku}</p>}
        </div>
      </td>
      <td className="p-4 align-middle">{row.stockName}</td>
      <td className={cn("p-4 align-middle text-right font-mono font-medium whitespace-nowrap", isEntry ? "text-success" : "text-destructive")}>
        <span className="inline-flex items-center gap-1">
          {isEntry ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {isEntry ? "+" : "−"}
          {formatNumber(absQty, 3)}
          {row.unit && <span className="text-muted-foreground ml-0.5 text-xs">{row.unit}</span>}
        </span>
      </td>
      <td className="p-4 align-middle">
        <span className="text-sm">{row.userName}</span>
      </td>
      <td className="p-4 align-middle">
        <Link
          href={sourceHref}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors",
            isOrder
              ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-success/30 bg-success/10 text-success hover:bg-success/20",
          )}
        >
          {isOrder ? "Commande" : "Achat"}
        </Link>
      </td>
      <td className="p-4 align-middle">
        <Link href={sourceHref} className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline">
          {row.reference}
        </Link>
      </td>
    </tr>
  );
}
