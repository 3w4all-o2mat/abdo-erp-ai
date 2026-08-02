"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createTransfer } from "@/lib/actions/stock-ops";

export function TransferForm({
  stocks, products,
}: {
  stocks: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
}) {
  const router = useRouter();
  const [fromStockId, setFromStockId] = React.useState("");
  const [toStockId, setToStockId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = React.useState<{ id: string; productId: string; qty: number }[]>([]);
  const [loading, setLoading] = React.useState(false);

  function add() { setLines([...lines, { id: crypto.randomUUID(), productId: "", qty: 1 }]); }
  function update(id: string, patch: Partial<{ productId: string; qty: number }>) { setLines(lines.map((l) => l.id === id ? { ...l, ...patch } : l)); }
  function remove(id: string) { setLines(lines.filter((l) => l.id !== id)); }

  async function save() {
    setLoading(true);
    try {
      await createTransfer({ fromStockId, toStockId, date: new Date(date), lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })) });
      router.push("/admin/stock-transfers"); router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm"><Link href="/admin/stock-transfers"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      <Card>
        <CardHeader><CardTitle>Nouveau transfert de stock</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Stock source *</Label><Select value={fromStockId} onValueChange={setFromStockId}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Stock destination *</Label><Select value={toStockId} onValueChange={setToStockId}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b"><tr><th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Produit</th><th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground w-32">Qté</th><th className="w-10"></th></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="p-2"><Select value={l.productId} onValueChange={(v) => update(l.id, { productId: v })}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent></Select></td>
                    <td className="p-2"><Input type="number" step="0.001" value={l.qty} onChange={(e) => update(l.id, { qty: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2 text-center"><Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(l.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-4 w-4" /> Ajouter une ligne</Button>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link href="/admin/stock-transfers">Annuler</Link></Button>
        <Button onClick={save} disabled={loading || !fromStockId || !toStockId || lines.length === 0}><Save className="h-4 w-4" /> {loading ? "..." : "Enregistrer"}</Button>
      </div>
    </div>
  );
}