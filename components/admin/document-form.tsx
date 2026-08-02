"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineEditor, type LineItem, type ProductOption } from "@/components/admin/line-editor";
import { computeLineAmount } from "@/lib/utils";
import {
  createQuotation, updateQuotation, createOrder, updateOrder,
  createInvoice, updateInvoice, createPurchase, updatePurchase,
} from "@/lib/actions/documents";
import { confirmDocument, cancelDocument } from "@/lib/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Save, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type DocType = "quotation" | "order" | "invoice" | "purchase";

type Partner = { id: string; name: string };
type Stock = { id: string; name: string };

export function DocumentForm({
  type, docId, initial, partners, partnerLabel, stocks, products, showStock, showExpiring, orderId,
  vatEnabled = true, remiseEnabled = true, companyVatRate = 0,
  templateHeader, templateFooter, companySettings, paymentDisplayDefault, hideBackButton,
  sourceQuotationId, orderPayments, currency,
}: {
  type: DocType;
  docId?: string;
  initial?: {
    reference?: string; date?: string; expiringDate?: string;
    partnerId?: string; stockId?: string; status?: string; orderId?: string | null;
    withTva?: boolean; withRemise?: boolean; remiseAmount?: number;
    paymentDisplay?: "hide" | "payments_only" | "payments_and_debts" | null;
    htAmount?: number; tvaAmount?: number; ttcAmount?: number;
    lines?: Array<LineItem & { productId: string }>;
  };
  partners: Partner[];
  partnerLabel: string;
  stocks: Stock[];
  products: ProductOption[];
  showStock?: boolean;
  showExpiring?: boolean;
  orderId?: string | null;
  vatEnabled?: boolean;
  remiseEnabled?: boolean;
  companyVatRate?: number;
  templateHeader?: string;
  templateFooter?: string;
  companySettings?: Record<string, string>;
  paymentDisplayDefault?: "hide" | "payments_only" | "payments_and_debts";
  hideBackButton?: boolean;
  sourceQuotationId?: string;
  orderPayments?: {
    orderId: string;
    clientId: string;
    clientName: string;
    ttcAmount: number;
    reglements: number;
    clientOldDebt: number;
    clientRemaining: number;
    payments: Array<{
      id: string;
      date: Date;
      clientId: string;
      client: unknown;
      amount: number;
      paymentMethod: string;
      observation: string | null;
    }>;
  };
  currency?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [partnerId, setPartnerId] = React.useState(initial?.partnerId ?? "");
  const [stockId, setStockId] = React.useState(initial?.stockId ?? stocks[0]?.id ?? "");
  const [date, setDate] = React.useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [expiringDate, setExpiringDate] = React.useState(initial?.expiringDate ?? "");
  const [lines, setLines] = React.useState<LineItem[]>(initial?.lines ?? []);
  const [withTva, setWithTva] = React.useState(initial?.withTva ?? vatEnabled);
  const [withRemise, setWithRemise] = React.useState(initial?.withRemise ?? remiseEnabled);
  const [remiseAmount, setRemiseAmount] = React.useState<number>(initial?.remiseAmount ?? 0);
  const status = initial?.status ?? "draft";

  const isReadOnly = status !== "draft";

  // Compute HT, TVA, TTC from lines
  const computedHT = lines.reduce((sum, l) => {
    const gross = l.qty * l.unitPrice;
    const net = gross * (1 - (l.discountRate || 0) / 100);
    return sum + net;
  }, 0);
  const computedTVA = withTva
    ? lines.reduce((sum, l) => {
        const gross = l.qty * l.unitPrice;
        const net = gross * (1 - (l.discountRate || 0) / 100);
        return sum + net * ((l.vatRate || 0) / 100);
      }, 0)
    : 0;
  const computedTTC = computedHT + computedTVA;

  async function save() {
    setLoading(true);
    try {
      const data = {
        date: new Date(date),
        expiringDate: expiringDate ? new Date(expiringDate) : null,
        clientId: type === "invoice" || type === "order" || type === "quotation" ? partnerId : undefined,
        supplierId: type === "purchase" ? partnerId : undefined,
        stockId: stockId || undefined,
        orderId: type === "invoice" ? orderId : undefined,
        ...(type === "quotation" ? { withTva, withRemise, remiseAmount, htAmount: computedHT, tvaAmount: computedTVA, ttcAmount: computedTTC } : {}),
        lines: lines.map((l) => ({ ...l, amount: computeLineAmount(l.qty, l.unitPrice, l.discountRate, l.vatRate) })),
      };
      let id = docId;
      if (type === "quotation") { if (docId) await updateQuotation(docId, data); else id = await createQuotation(data); }
      else if (type === "order") { if (docId) await updateOrder(docId, data); else id = await createOrder(data); }
      else if (type === "invoice") { if (docId) await updateInvoice(docId, data); else id = await createInvoice(data); }
      else if (type === "purchase") { if (docId) await updatePurchase(docId, data); else id = await createPurchase(data); }
      router.push(listHref());
      router.refresh();
    } finally { setLoading(false); }
  }

  function listHref() {
    return type === "quotation" ? "/admin/quotations" : type === "order" ? "/admin/orders" : type === "invoice" ? "/admin/invoices" : "/admin/purchases";
  }
  function editHref() { return `${listHref()}/${docId}`; }

  const entityName = type === "quotation" ? "quotations" : type === "order" ? "orders" : type === "invoice" ? "invoices" : "purchases";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm"><Link href={listHref()}><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
        {docId && status === "draft" && (
          <div className="flex gap-2">
            <ConfirmDialog
              trigger={<Button variant="success" size="sm"><CheckCircle2 className="h-4 w-4" /> Confirmer</Button>}
              title="Confirmer ce document ?"
              description="Cette action écrira les mouvements de stock et ne pourra pas être annulée facilement."
              confirmLabel="Confirmer" variant="success"
              onConfirm={() => confirmDocument(entityName, docId!)}
            />
          </div>
        )}
        {docId && status === "confirmed" && (
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm"><XCircle className="h-4 w-4" /> Annuler</Button>}
            title="Annuler ce document ?"
            description="Les mouvements de stock seront contre-passés."
            confirmLabel="Annuler le document"
            onConfirm={() => cancelDocument(entityName, docId!)}
          />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>{docId ? `Modifier — ${initial?.reference ?? ""}` : "Nouveau document"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:justify-between">
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center min-w-0">
                <Label className="shrink-0">{partnerLabel} *</Label>
                <SearchableSelect
                  value={partnerId}
                  onValueChange={setPartnerId}
                  options={partners.map((p) => ({ value: p.id, label: p.name }))}
                  disabled={isReadOnly}
                  clearable
                />
              </div>
              {showStock && (
                <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center min-w-0">
                  <Label className="shrink-0">Stock *</Label>
                  <Select value={stockId} onValueChange={setStockId} disabled={isReadOnly}>
                  <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-4 items-center lg:w-72">
              <Label htmlFor="date" className="shrink-0">Date Devis</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isReadOnly} />
              {showExpiring && (
                <>
                  <Label htmlFor="expiringDate" className="shrink-0">Date d'expiration</Label>
                  <Input id="expiringDate" type="date" value={expiringDate} onChange={(e) => setExpiringDate(e.target.value)} disabled={isReadOnly} />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {type === "quotation" ? (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="lignes">
              <TabsList>
                <TabsTrigger value="lignes">Lignes</TabsTrigger>
                <TabsTrigger value="parametres">Paramètres</TabsTrigger>
              </TabsList>
              <TabsContent value="lignes">
                {isReadOnly ? (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 border-b">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Désignation</th>
                          <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Qté</th>
                          <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">P.U.</th>
                          <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Remise</th>
                          {vatEnabled && <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">TVA</th>}
                          <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.id} className="border-b last:border-0">
                            <td className="p-3">{l.designation}</td>
                            <td className="p-3 text-right">{l.qty}</td>
                            <td className="p-3 text-right">{l.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right">{l.discountRate}%</td>
                            {vatEnabled && <td className="p-3 text-right">{l.vatRate}%</td>}
                            <td className="p-3 text-right font-medium">{l.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end border-t bg-muted/20 px-3 py-3">
                      <div className="w-64 space-y-1.5">
                        {withTva && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total HT</span>
                            <span className="font-medium">{computedHT.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                          </div>
                        )}
                        {withTva && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total TVA</span>
                            <span className="font-medium">{computedTVA.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1.5">
                          <span className="font-semibold">{withTva ? "Total TTC" : "Total"}</span>
                          <span className="text-lg font-bold">{computedTTC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <LineEditor lines={lines} setLines={setLines} products={products} vatEnabled={withTva} companyVatRate={companyVatRate} />
                )}
              </TabsContent>
              <TabsContent value="parametres">
                <div className="space-y-4 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Avec TVA</div>
                      <div className="text-xs text-muted-foreground">Active le calcul et l'affichage de la TVA sur les lignes.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={withTva} onChange={(e) => setWithTva(e.target.checked)} disabled={isReadOnly} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Avec remise</div>
                      <div className="text-xs text-muted-foreground">Active une remise globale sur le total du devis.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={withRemise} onChange={(e) => setWithRemise(e.target.checked)} disabled={isReadOnly} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 w-48">
                      <Label htmlFor="remiseAmount" className="text-xs text-muted-foreground shrink-0">Montant</Label>
                      <Input
                        id="remiseAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={remiseAmount}
                        onChange={(e) => setRemiseAmount(Number(e.target.value))}
                        disabled={isReadOnly || !withRemise}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Lignes</CardTitle></CardHeader>
          <CardContent>
            {isReadOnly ? (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Désignation</th>
                      <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Qté</th>
                      <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">P.U.</th>
                      <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Remise</th>
                      {vatEnabled && <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">TVA</th>}
                      <th className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="p-3">{l.designation}</td>
                        <td className="p-3 text-right">{l.qty}</td>
                        <td className="p-3 text-right">{l.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right">{l.discountRate}%</td>
                        {vatEnabled && <td className="p-3 text-right">{l.vatRate}%</td>}
                        <td className="p-3 text-right font-medium">{l.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end border-t bg-muted/20 px-3 py-3">
                  <div className="w-64 space-y-1.5">
                    {withTva && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total HT</span>
                        <span className="font-medium">{computedHT.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                      </div>
                    )}
                    {withTva && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total TVA</span>
                        <span className="font-medium">{computedTVA.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1.5">
                      <span className="font-semibold">{withTva ? "Total TTC" : "Total"}</span>
                      <span className="text-lg font-bold">{computedTTC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <LineEditor lines={lines} setLines={setLines} products={products} vatEnabled={withTva} companyVatRate={companyVatRate} />
            )}
          </CardContent>
        </Card>
      )}

      {!isReadOnly && (
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline"><Link href={listHref()}>Annuler</Link></Button>
          <Button onClick={save} disabled={loading || !partnerId || lines.length === 0}>
            <Save className="h-4 w-4" /> {loading ? "..." : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}