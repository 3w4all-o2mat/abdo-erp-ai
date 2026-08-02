"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPaymentClient, createPaymentSupplier } from "@/lib/actions/payments";
import { AlertTriangle } from "lucide-react";

export function PaymentFormDialog({
  trigger, kind, partners,
  // When `clientId` is set the partner Select is hidden and this id is used.
  clientId,
  // When `orderId` is set, the payment is linked to the order (order_id column).
  orderId,
  // Pre-fills the "Montant" field. Use the remaining amount to support partial
  // payments out of the box.
  defaultAmount,
  // When provided, a helper "Reste à payer: X" is shown and a soft warning is
  // displayed if the entered amount exceeds this value (submission is still
  // allowed).
  remainingAmount,
  // Optional title/description override (e.g. when embedded in the order page).
  title, description,
}: {
  trigger?: React.ReactNode;
  kind: "client" | "supplier";
  partners: { id: string; name: string }[];
  clientId?: string;
  orderId?: string;
  defaultAmount?: number;
  remainingAmount?: number;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [partnerId, setPartnerId] = React.useState(clientId ?? "");
  const [amount, setAmount] = React.useState<string>(
    defaultAmount !== undefined ? String(defaultAmount) : "",
  );

  // Reset the form state every time the dialog opens so the caller can
  // recompute the default amount (e.g. after a new payment is added on the
  // order page and the remaining amount drops).
  React.useEffect(() => {
    if (open) {
      setPartnerId(clientId ?? "");
      setAmount(defaultAmount !== undefined ? String(defaultAmount) : "");
    }
  }, [open, clientId, defaultAmount]);

  const showClientSelect = !clientId && kind === "client";
  const showSupplierSelect = !clientId && kind === "supplier";
  const isOverRemaining = remainingAmount !== undefined && Number(amount) > remainingAmount + 0.001;
  const resolvedPartnerId = clientId ?? partnerId;
  const canSubmit = !loading && !!resolvedPartnerId && amount !== "" && !isNaN(Number(amount)) && Number(amount) > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      date: new Date(String(fd.get("date"))),
      amount: Number(fd.get("amount")),
      paymentMethod: String(fd.get("paymentMethod")),
      observation: String(fd.get("observation") || ""),
    };
    try {
      if (kind === "client") {
        await createPaymentClient({ clientId: resolvedPartnerId, orderId: orderId ?? null, ...data });
      } else {
        await createPaymentSupplier({ supplierId: resolvedPartnerId, ...data });
      }
      setOpen(false);
    } finally { setLoading(false); }
  }

  const resolvedTitle = title ?? (kind === "client" ? "Encaissement client" : "Paiement fournisseur");
  const resolvedDescription = description ?? "Enregistrez un nouveau paiement.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {showClientSelect && (
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {showSupplierSelect && (
            <div className="space-y-2">
              <Label>Fournisseur *</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div>
            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              {remainingAmount !== undefined && (
                <p className="text-xs text-muted-foreground">Reste à payer : {remainingAmount.toFixed(2)}</p>
              )}
              {isOverRemaining && remainingAmount !== undefined && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Le montant dépasse le reste à payer ({remainingAmount.toFixed(2)}).
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Méthode *</Label>
            <Select name="paymentMethod" defaultValue="cash">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="observation">Observation</Label><Textarea id="observation" name="observation" /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={!canSubmit}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}