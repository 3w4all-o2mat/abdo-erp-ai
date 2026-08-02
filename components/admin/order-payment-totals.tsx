"use client";
import * as React from "react";
import { formatMoney } from "@/lib/utils";
import { useSettingsCurrency } from "@/components/providers/settings-provider";
import type { PaymentDisplay } from "@/lib/settings";

/**
 * Renders the "Règlements / Anciennes dettes / Reste à payer" block that
 * appears under the Total TTC line of an order, controlled by the
 * `paymentDisplay` value (per-order override or global default).
 *
 *   - `hide`               -> nothing rendered
 *   - `payments_only`      -> 2 lines: Règlements + Reste à payer (client total)
 *   - `payments_and_debts` -> 3 lines: + Anciennes dettes (other confirmed
 *                            orders' debt) before the client total.
 *
 * "Reste à payer" is the client's total outstanding balance: sum of TTC of
 * all confirmed orders of the client, minus all client payments linked to a
 * confirmed order or unallocated. Per-order remaining is no longer shown
 * separately.
 */
export function OrderPaymentTotals({
  paymentDisplay,
  ttcAmount,
  reglements,
  clientOldDebt,
  clientRemaining,
}: {
  paymentDisplay: PaymentDisplay;
  ttcAmount: number;
  reglements: number;
  clientOldDebt: number;
  clientRemaining: number;
}) {
  const currency = useSettingsCurrency();
  if (paymentDisplay === "hide") return null;

  const fmt = (n: number) => formatMoney(n, currency);
  // Color debts red, over-payments green, settled grey.
  const debtClass = (n: number) =>
    n > 0.0001
      ? "text-destructive font-medium"
      : n < -0.0001
      ? "text-emerald-600 font-medium"
      : "text-muted-foreground font-medium";

  // "Reste à payer" = sum of TTC of all confirmed orders of the client, minus
  // all client payments (linked to a confirmed order or unallocated). The
  // per-order remaining is no longer rendered separately: the block already
  // shows "Règlements" (paid on this order) and "Anciennes dettes" (other
  // confirmed orders' debt), so the bottom line is the client's total
  // outstanding balance.
  const thisOrderRemaining = clientRemaining;

  return (
    <div className="space-y-1 pt-1.5 border-t">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Règlements</span>
        <span className="font-medium">{fmt(reglements)}</span>
      </div>
      {paymentDisplay === "payments_and_debts" && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Anciennes dettes</span>
            <span className={debtClass(clientOldDebt)}>{fmt(clientOldDebt)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Reste à payer</span>
        <span className={debtClass(thisOrderRemaining)}>{fmt(thisOrderRemaining)}</span>
      </div>
    </div>
  );
}
