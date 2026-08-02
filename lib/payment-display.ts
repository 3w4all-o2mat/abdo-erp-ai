// Shared constants for the `payments.display` setting and the per-order
// `payment_display` column. Used by:
//   - `app/admin/settings/modules/page.tsx` (admin global setting)
//   - `components/admin/document-form.tsx` (per-order override)
//
// Keep the slugs in sync with `PAYMENT_DISPLAY_VALUES` in `lib/settings.ts`
// and with the `Order.paymentDisplay` field in `prisma/schema.prisma`.
export const PAYMENT_DISPLAY_OPTIONS: { value: string; label: string }[] = [
  { value: "hide", label: "Masquer" },
  { value: "payments_only", label: "Paiements seulement" },
  { value: "payments_and_debts", label: "Paiements et dettes" },
];
