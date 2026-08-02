"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { computeLineAmount, formatMoney } from "@/lib/utils";

export type LineItem = {
  id: string;
  productId: string;
  designation: string;
  qty: number;
  unitPrice: number;
  discountRate: number;
  vatRate: number;
  amount: number;
};

export type ProductOption = { id: string; name: string; sku: string; unitPrice: number; unitOfMeasure: string };

export function LineEditor({
  lines, setLines, products, vatEnabled = true, withRemise = false, remiseAmount = 0, companyVatRate = 0, currency,
}: {
  lines: LineItem[];
  setLines: (l: LineItem[]) => void;
  products: ProductOption[];
  vatEnabled?: boolean;
  withRemise?: boolean;
  remiseAmount?: number;
  companyVatRate?: number;
  currency?: string;
}) {
  const hasVat = vatEnabled && companyVatRate > 0;
  function add() {
    setLines([...lines, { id: crypto.randomUUID(), productId: "", designation: "", qty: 1, unitPrice: 0, discountRate: 0, vatRate: 0, amount: 0 }]);
  }
  function update(id: string, patch: Partial<LineItem>) {
    setLines(lines.map((l) => {
      if (l.id !== id) return l;
      const next = { ...l, ...patch };
      if (patch.productId) {
        const p = products.find((x) => x.id === patch.productId);
        if (p) { next.unitPrice = p.unitPrice; next.designation = p.name; }
      }
      next.amount = computeLineAmount(next.qty, next.unitPrice, next.discountRate, next.vatRate);
      return next;
    }));
  }
  function remove(id: string) { setLines(lines.filter((l) => l.id !== id)); }

  const totalHT = lines.reduce((a, l) => a + l.qty * l.unitPrice * (1 - l.discountRate / 100), 0);
  const remise = withRemise ? remiseAmount : 0;
  const totalTVA = hasVat ? (totalHT - remise) * (companyVatRate / 100) : 0;
  const total = totalHT - remise + totalTVA;
  const vatRateLabel = hasVat ? ` ${companyVatRate}%` : "";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto scrollbar-thin rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Produit</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground w-40">Désignation</th>
              <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground w-24">Qté</th>
              <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground w-28">P.U.</th>
              <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground w-32">Montant</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucune ligne. Cliquez sur « Ajouter une ligne ».</td></tr>}
            {lines.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="p-2">
                  <Select value={l.productId} onValueChange={(v) => update(l.id, { productId: v })}>
                    <SelectTrigger className="min-w-[180px]"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2"><Input value={l.designation} onChange={(e) => update(l.id, { designation: e.target.value })} /></td>
                <td className="p-2"><Input type="number" step="0.001" value={l.qty} onChange={(e) => update(l.id, { qty: Number(e.target.value) })} className="text-right" /></td>
                <td className="p-2"><Input type="number" step="0.01" value={l.unitPrice} onChange={(e) => update(l.id, { unitPrice: Number(e.target.value) })} className="text-right" /></td>
                <td className="p-2 text-right font-medium">{formatMoney(l.qty * l.unitPrice, currency ?? "DA")}</td>
                <td className="p-2 text-center"><Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(l.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-4 w-4" /> Ajouter une ligne</Button>
      <div className="flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          {hasVat && <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span className="font-medium">{formatMoney(totalHT, currency ?? "DA")}</span></div>}
          {remise > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span className="font-medium">- {formatMoney(remise, currency ?? "DA")}</span></div>}
          {hasVat && <div className="flex justify-between"><span className="text-muted-foreground">Total TVA{vatRateLabel}</span><span className="font-medium">{formatMoney(totalTVA, currency ?? "DA")}</span></div>}
          <div className="flex justify-between border-t pt-1.5 text-base"><span className="font-semibold">{hasVat ? "Total TTC" : "Total"}</span><span className="font-bold">{formatMoney(total, currency ?? "DA")}</span></div>
        </div>
      </div>
    </div>
  );
}