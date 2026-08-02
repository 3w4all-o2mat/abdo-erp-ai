import { prisma } from "@/lib/prisma";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { getCompanyCurrency } from "@/lib/settings";
import { SettingsProvider } from "@/components/providers/settings-provider";

// Reads site settings from the DB → must render at request time.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, currency] = await Promise.all([prisma.setting.findMany(), getCompanyCurrency()]);
  const get = (k: string) => settings.find((s) => s.key === k)?.value;
  const siteTitle = get("site.title") ?? "Mini ERP";
  const company = {
    name: get("company.name") ?? "",
    address: get("company.address"),
    phone: get("company.phone"),
    email: get("company.email"),
  };
  return (
    <SettingsProvider currency={currency}>
      <div className="flex min-h-screen flex-col">
        <PublicNavbar siteTitle={siteTitle} />
        <main className="flex-1">{children}</main>
        <PublicFooter siteTitle={siteTitle} company={company} />
      </div>
    </SettingsProvider>
  );
}