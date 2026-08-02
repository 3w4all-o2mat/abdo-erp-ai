import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Reads the `company.currency` setting from the database.
 * Cached per request via React's `cache` so multiple calls in the same render
 * tree only hit the database once.
 */
export const getCompanyCurrency = cache(async (): Promise<string> => {
  const setting = await prisma.setting.findUnique({ where: { key: "company.currency" } });
  return setting?.value || "DZD";
});

/**
 * Reads the `template.header` setting — the HTML/text injected at the top of
 * print templates (devis, commandes, factures, ...). Returns an empty string
 * when the setting has not been configured yet.
 */
export const getPrintHeader = cache(async (): Promise<string> => {
  const setting = await prisma.setting.findUnique({ where: { key: "template.header" } });
  return setting?.value ?? "";
});

/**
 * Reads the `template.footer` setting — the HTML/text injected at the bottom
 * of print templates. Returns an empty string when the setting has not been
 * configured yet.
 */
export const getPrintFooter = cache(async (): Promise<string> => {
  const setting = await prisma.setting.findUnique({ where: { key: "template.footer" } });
  return setting?.value ?? "";
});

/**
 * Returns every `company.*` and `site.*` setting as a flat
 * `Record<key, value>` map. Used by the document print / preview flow to
 * resolve `{{company.name}}`-style placeholders inside the header and
 * footer templates, so the print output never contains raw placeholders.
 *
 * Cached per request via React's `cache`.
 */
export const getCompanyAndSiteSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await prisma.setting.findMany({
    where: { category: { in: ["company", "site"] } },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
});

/**
 * Returns the keys of all `<module>.confirmed_by_default` settings used by
 * `isModuleConfirmedByDefault`. Module slugs match the ones used in
 * `prisma.module` (quotations, orders, invoices).
 */
const CONFIRMED_BY_DEFAULT_KEYS = {
  quotations: "quotations.confirmed_by_default",
  orders: "orders.confirmed_by_default",
  invoices: "invoices.confirmed_by_default",
  purchases: "purchases.confirmed_by_default",
} as const;

export type DocumentModule = keyof typeof CONFIRMED_BY_DEFAULT_KEYS;

/**
 * Reads the `<module>.confirmed_by_default` setting for a document module and
 * returns `true` only if the stored value is the literal string `"true"`. Any
 * other value (including `null`/missing) is treated as `false` so newly created
 * documents default to draft unless an admin explicitly enables the toggle.
 */
export const isModuleConfirmedByDefault = cache(
  async (module: DocumentModule): Promise<boolean> => {
    const key = CONFIRMED_BY_DEFAULT_KEYS[module];
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value === "true";
  },
);

/**
 * Reads any setting as a number. Returns `null` if the setting is missing or
 * if the stored value is not a valid finite number. Cached per request via
 * React's `cache` so multiple calls in the same render tree only hit the
 * database once.
 */
export const getSettingNumber = cache(async (key: string): Promise<number | null> => {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  const n = Number(setting.value);
  return Number.isFinite(n) ? n : null;
});

/**
 * Returns the default `expiringDate` for a new quotation by reading the
 * `quotations.validity_offer_days` setting and adding that many days to the
 * provided base date. Returns `null` when the setting is missing, zero, or
 * not a valid positive number.
 *
 * Cached per request via React's `cache` so multiple calls in the same
 * render tree only hit the database once.
 */
export const getDefaultQuotationExpiry = cache(
  async (baseDate: Date = new Date()): Promise<Date | null> => {
    const days = await getSettingNumber("quotations.validity_offer_days");
    if (!days || days <= 0) return null;
    const result = new Date(baseDate);
    result.setDate(result.getDate() + days);
    return result;
  },
);

/**
 * Reads the `invoices.show_in_sidebar` setting and returns whether the
 * "Factures" entry should be visible in the admin sidebar. Defaults to
 * `true` (visible) when the setting is missing, so existing installs that
 * have not been migrated yet keep the same behaviour. Any value other than
 * the literal string `"false"` is treated as visible.
 *
 * Cached per request via React's `cache` so the admin layout can call it on
 * every navigation without hitting the database more than once per render.
 */
export const isInvoicesSidebarVisible = cache(async (): Promise<boolean> => {
  const setting = await prisma.setting.findUnique({ where: { key: "invoices.show_in_sidebar" } });
  return setting?.value !== "false";
});

/**
 * Allowed slugs for the `payments.display` setting and the per-order
 * `payment_display` column. The slugs are kept in sync with the migration
 * `20260725120000_add_payments_display/migration.sql` and with the option
 * list used in `app/admin/settings/modules/page.tsx` and in
 * `components/admin/document-form.tsx`.
 */
export const PAYMENT_DISPLAY_VALUES = [
  "hide",
  "payments_only",
  "payments_and_debts",
] as const;

export type PaymentDisplay = (typeof PAYMENT_DISPLAY_VALUES)[number];

/** Default value used when the setting is missing or invalid. */
export const DEFAULT_PAYMENT_DISPLAY: PaymentDisplay = "hide";

/**
 * Returns the slug of the option that should appear in the dropdown labels
 * for the given stored value. Falls back to `DEFAULT_PAYMENT_DISPLAY` when
 * the stored value is missing, empty, or not one of `PAYMENT_DISPLAY_VALUES`.
 */
function normalizePaymentDisplay(value: string | null | undefined): PaymentDisplay {
  if (!value) return DEFAULT_PAYMENT_DISPLAY;
  return (PAYMENT_DISPLAY_VALUES as readonly string[]).includes(value)
    ? (value as PaymentDisplay)
    : DEFAULT_PAYMENT_DISPLAY;
}

/**
 * Reads the `payments.display` setting and returns its value, normalized to
 * one of `PAYMENT_DISPLAY_VALUES`. Falls back to `DEFAULT_PAYMENT_DISPLAY`
 * ("hide") when the setting is missing or invalid so the UI always has a
 * safe default.
 *
 * Cached per request via React's `cache` so the order page and any other
 * server component can call it without hitting the database more than once.
 */
export const getPaymentDisplay = cache(async (): Promise<PaymentDisplay> => {
  const setting = await prisma.setting.findUnique({ where: { key: "payments.display" } });
  return normalizePaymentDisplay(setting?.value);
});

/**
 * Returns the effective payment display for a single order, applying the
 * per-order override on top of the global default. Pure helper (no DB call)
 * so it can be used freely inside JSX.
 */
export function resolvePaymentDisplay(
  orderPaymentDisplay: string | null | undefined,
  globalPaymentDisplay: PaymentDisplay,
): PaymentDisplay {
  return normalizePaymentDisplay(orderPaymentDisplay ?? globalPaymentDisplay);
}

// ---------------------------------------------------------------------------
// Order payment aggregates
// ---------------------------------------------------------------------------
// `getOrderPaymentStats` lives here (not in `lib/actions/payments.ts`) because
// that file is marked `"use server"` and exports only async server actions.
// This helper is a regular server function that uses `cache()` for per-request
// memoization.

/**
 * Aggregates used by the order detail page to render the payment totals block
 * under the Total TTC line.
 *
 *   - `reglements`:      sum of all `PaymentClient` rows linked to this order
 *                        (payments against draft / canceled orders are
 *                        ignored — they don't represent collected funds from
 *                        a finalised sale).
 *   - `clientOldDebt`:   TTC total of all OTHER **confirmed** orders of the
 *                        same client, minus all payments of the client
 *                        (linked to a confirmed order, or unallocated) that
 *                        are NOT linked to this order.
 *   - `clientRemaining`: TTC total of ALL **confirmed** orders of the client
 *                        minus all payments of the client (linked to a
 *                        confirmed order, or unallocated).
 */
export type OrderPaymentStats = {
  reglements: number;
  clientOldDebt: number;
  clientRemaining: number;
};

/**
 * Only "confirmed" orders count toward client debt: draft orders are not yet
 * final, and canceled orders are explicitly excluded. Payments on draft /
 * canceled orders are also ignored so a payment against an order that doesn't
 * count as debt can't artificially reduce the client's outstanding balance.
 * Unallocated payments (no `orderId`) still count — they represent real cash
 * received from the client.
 */
const CONFIRMED_OR_UNLINKED_PAYMENT_WHERE = {
  OR: [
    { orderId: null },
    { order: { is: { status: "confirmed" } } },
  ],
};

/**
 * Reads the aggregate payment/debt numbers for one order. Cached for the
 * duration of the request via React's `cache`. 5 small `aggregate` queries
 * scoped by `clientId` / `orderId` — cheap on the indexes we already have.
 */
export const getOrderPaymentStats = cache(
  async (orderId: string, clientId: string): Promise<OrderPaymentStats> => {
    const [reglementsAgg, otherOrdersAgg, otherPaymentsAgg, allOrdersAgg, allPaymentsAgg] = await Promise.all([
      prisma.paymentClient.aggregate({ _sum: { amount: true }, where: { orderId, AND: [CONFIRMED_OR_UNLINKED_PAYMENT_WHERE] } }),
      prisma.order.aggregate({ _sum: { ttcAmount: true }, where: { clientId, status: "confirmed", NOT: { id: orderId } } }),
      prisma.paymentClient.aggregate({ _sum: { amount: true }, where: { clientId, NOT: { orderId }, AND: [CONFIRMED_OR_UNLINKED_PAYMENT_WHERE] } }),
      prisma.order.aggregate({ _sum: { ttcAmount: true }, where: { clientId, status: "confirmed" } }),
      prisma.paymentClient.aggregate({ _sum: { amount: true }, where: { clientId, AND: [CONFIRMED_OR_UNLINKED_PAYMENT_WHERE] } }),
    ]);

    const reglements = Number(reglementsAgg._sum.amount ?? 0);
    const otherOrdersTotal = Number(otherOrdersAgg._sum.ttcAmount ?? 0);
    const otherPaymentsTotal = Number(otherPaymentsAgg._sum.amount ?? 0);
    const allOrdersTotal = Number(allOrdersAgg._sum.ttcAmount ?? 0);
    const allPaymentsTotal = Number(allPaymentsAgg._sum.amount ?? 0);

    return {
      reglements,
      clientOldDebt: otherOrdersTotal - otherPaymentsTotal,
      clientRemaining: allOrdersTotal - allPaymentsTotal,
    };
  },
);
