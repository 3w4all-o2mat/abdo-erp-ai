"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog } from "@/components/admin/payment-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteRecord } from "@/lib/actions";
import { formatDate, formatMoney } from "@/lib/utils";
import { useSettingsCurrency } from "@/components/providers/settings-provider";
import { Plus, Trash2 } from "lucide-react";
import type { PaymentClientRow } from "@/components/admin/admin-table";

const METHODS: Record<string, string> = { cash: "Espèces", check: "Chèque", transfer: "Virement" };

/**
 * Panel displayed in the "Paiements" tab of the order detail page.
 * Shows paid/remaining totals, a "Nouveau paiement" button and the list of
 * payments linked to this order (via `order_id`).
 */
export function OrderPaymentsPanel({
  orderId,
  clientId,
  clientName,
  ttcAmount,
  payments,
}: {
  orderId: string;
  clientId: string;
  clientName: string;
  ttcAmount: number;
  payments: PaymentClientRow[];
}) {
  const currency = useSettingsCurrency();
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, ttcAmount - totalPaid);
  const sorted = React.useMemo(
    () => [...payments].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [payments],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total commande</p>
          <p className="text-lg font-semibold">{formatMoney(ttcAmount, currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total payé</p>
          <p className="text-lg font-semibold text-success">{formatMoney(totalPaid, currency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Reste à payer</p>
          <p className={`text-lg font-semibold ${remaining > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {formatMoney(remaining, currency)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{payments.length} paiement(s) pour {clientName}</p>
        <PaymentFormDialog
          kind="client"
          partners={[]}
          clientId={clientId}
          orderId={orderId}
          defaultAmount={remaining}
          remainingAmount={remaining}
          title="Nouveau paiement"
          description={`Encaissement pour la commande (client : ${clientName}).`}
          trigger={<Button size="sm"><Plus className="h-4 w-4" /> Nouveau paiement</Button>}
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {sorted.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Aucun paiement enregistré pour cette commande.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Méthode</th>
                  <th className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observation</th>
                  <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant</th>
                  <th className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                    <td className="p-4 align-middle">{formatDate(p.date)}</td>
                    <td className="p-4 align-middle">{METHODS[p.paymentMethod] ?? p.paymentMethod}</td>
                    <td className="p-4 align-middle text-muted-foreground">{p.observation ?? "—"}</td>
                    <td className="p-4 align-middle text-right font-medium">{formatMoney(p.amount, currency)}</td>
                    <td className="p-4 align-middle text-right">
                      <ConfirmDialog
                        title="Supprimer ce paiement ?"
                        onConfirm={() => deleteRecord("payments_clients", p.id, "payments_clients.delete")}
                      >
                        <Button variant="ghost" size="icon-sm" className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </ConfirmDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
