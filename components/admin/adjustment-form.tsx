"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createAdjustment } from "@/lib/actions/stock-ops";

export function AdjustmentForm({
  stocks, products,
}: {
  stocks: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
}) {
  const router = useRouter();
  const [stockId, setStockId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState("");
  const [lines, setLines] = React.useState<{ id: string; productId: string; qtySigned: number }[]>([]);
  const [loading, setLoading] = React.useState(false);

  function add() { setLines([...lines, { id: crypto.randomUUID(), productId: "", qtySigned: 0 }]); }
  function update(id: string, patch: Partial<{ productId: string; qtySigned: number }>) { setLines(lines.map((l) => l.id === id ? { ...l, ...patch } : l)); }
  function remove(id: string) { setLines(lines.filter((l) => l.id !== id)); }

  async function save() {
    setLoading(true);
    try {
      await createAdjustment({ stockId, date: new Date(date), reason, lines: lines.map((l) => ({ productId: l.productId, qtySigned: l.qtySigned })) });
      router.push("/admin/stock-adjustments"); router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm"><Link href="/admin/stock-adjustments"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      <Card>
        <CardHeader><CardTitle>Nouvel ajustement de stock</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Stock *</Label><Select value={stockId} onValueChange={setStockId}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="reason">Motif</Label><Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Inventaire, perte, casse..." /></div>
          </div>
          <div className="rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b"><tr><th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Produit</th><th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground w-40">Qté (±)</th><th className="w-10"></th></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="p-2"><Select value={l.productId} onValueChange={(v) => update(l.id, { productId: v })}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent></Select></td>
                    <td className="p-2"><Input type="number" step="0.001" value={l.qtySigned} onChange={(e) => update(l.id, { qtySigned: Number(e.target.value) })} className="text-right" placeholder="+/-" /></td>
                    <td className="p-2 text-center"><Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(l.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-4 w-4" /> Ajouter une ligne</Button>
          <p className="text-xs text-muted-foreground">Utilisez une quantité positive pour ajouter, négative pour retirer du stock.</p>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link href="/admin/stock-adjustments">Annuler</Link></Button>
        <Button onClick={save} disabled={loading || !stockId || lines.length === 0}><Save className="h-4 w-4" /> {loading ? "..." : "Enregistrer"}</Button>
      </div>
    </div>
  );
}