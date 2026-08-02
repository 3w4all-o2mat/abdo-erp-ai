import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { NAV_SECTIONS, filterNav } from "@/lib/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCompanyCurrency, isInvoicesSidebarVisible } from "@/lib/settings";
import { SettingsProvider } from "@/components/providers/settings-provider";

// Reads the current user + settings from the DB → must render at request time.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  const [currency, invoicesSidebarVisible] = await Promise.all([
    getCompanyCurrency(),
    isInvoicesSidebarVisible(),
  ]);
  // Build the set of settings that currently force their corresponding nav
  // item to be hidden. The set is passed to `filterNav` so the sidebar (and
  // mobile drawer) drop those entries before the client component mounts.
  const hiddenSettings = new Set<string>();
  if (!invoicesSidebarVisible) hiddenSettings.add("invoices.show_in_sidebar");
  const sections = filterNav(NAV_SECTIONS, user, hiddenSettings);
  return (
    <SettingsProvider currency={currency}>
      <AdminShell sections={sections}>{children}</AdminShell>
    </SettingsProvider>
  );
}