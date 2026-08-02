import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency. The currency suffix is required so every call
 * site uses the value configured in `settings.company.currency`. In client
 * components, read the value via the `useSettingsCurrency` hook from
 * `@/components/providers/settings-provider`.
 */
export function formatMoney(value: number | null | undefined, currency: string): string {
  const v = Number(value ?? 0);
  const num = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
  return `${num} ${currency}`;
}

/** Format a number with thousands separators. */
export function formatNumber(value: number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(
    Number(value ?? 0),
  );
}

/** Format a date in French. */
export function formatDate(value: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", opts ?? { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  return formatDate(value, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** ISO date key (yyyy-MM-dd) used to group rows by day. */
export function dayKey(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO week key (yyyy-Www) used to group rows by week. */
export function weekKey(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  // Copy date to avoid mutation
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday of the current week determines the year
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Month key (yyyy-MM) used to group rows by month. */
export function monthKey(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Year key (yyyy) used to group rows by year. */
export function yearKey(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return String(d.getFullYear());
}

/** Pretty label for a time-bucket key, used as the section header in the grouped table. */
export function formatGroupLabel(groupBy: "day" | "week" | "month" | "year", key: string): string {
  if (!key) return "";
  if (groupBy === "day") {
    const [y, m, d] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  }
  if (groupBy === "week") {
    // "2026-W12" → "Semaine 12 — 2026"
    const m = key.match(/^(\d{4})-W(\d{2})$/);
    return m && m[1] && m[2] ? `Semaine ${parseInt(m[2], 10)} — ${m[1]}` : key;
  }
  if (groupBy === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y ?? 1970, (m ?? 1) - 1, 1));
  }
  // year
  return key;
}

/** Tokens supported in a Module.namingDoc pattern, used to render the next reference. */
export const NAMING_TOKENS = [
  { token: "{year}", label: "Année (4 chiffres, ex. 2026)" },
  { token: "{year2}", label: "Année (2 chiffres, ex. 26)" },
  { token: "{month}", label: "Mois (01–12)" },
  { token: "{seq}", label: "Compteur (5 chiffres, ex. 00042)" },
  { token: "{sequence}", label: "Alias de {seq}" },
] as const;

/** Generate a document reference from a naming pattern like "DEV/{year}/{sequence}". */
export function generateReference(pattern: string, sequence: number, date = new Date()): string {
  const seq = String(sequence).padStart(5, "0");
  const year2 = String(date.getFullYear()).slice(-2);
  return pattern
    .replaceAll("{year}", String(date.getFullYear()))
    .replaceAll("{year2}", year2)
    .replaceAll("{seq}", seq)
    .replaceAll("{sequence}", seq)
    .replaceAll("{month}", String(date.getMonth() + 1).padStart(2, "0"));
}

/** Compute line amount with discount + VAT. */
export function computeLineAmount(qty: number, unitPrice: number, discountRate = 0, vatRate = 0): number {
  const gross = qty * unitPrice;
  const net = gross * (1 - (discountRate || 0) / 100);
  const withVat = net * (1 + (vatRate || 0) / 100);
  return Math.round(withVat * 100) / 100;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}