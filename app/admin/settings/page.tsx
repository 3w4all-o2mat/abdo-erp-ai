export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  await requirePermission("settings.view");
  const settings = await prisma.setting.findMany({ orderBy: { sequence: "asc" } });
  const company = settings.filter((s) => s.category === "company");
  const site = settings.filter((s) => s.category === "site");
  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Configurez votre entreprise et votre site." />
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsForm settings={company} title="Entreprise" description="Informations légales et de contact." />
        <SettingsForm settings={site} title="Site public" description="Apparence du site public." />
      </div>
    </div>
  );
}
