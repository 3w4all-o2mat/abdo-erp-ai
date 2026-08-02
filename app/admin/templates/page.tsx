import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { TemplatesForm } from "@/components/admin/templates-form";
import { TEMPLATE_VARIABLES } from "@/lib/template-variables";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requirePermission("settings.view");

  // Load the two print template settings (header & footer) and every
  // `company.*` / `site.*` value that can be inserted as a `{{...}}`
  // placeholder. The `template` category is reserved for the two HTML
  // bodies; the others are resolved at preview / print time.
  const [templateRows, variableRows] = await Promise.all([
    prisma.setting.findMany({
      where: { key: { in: ["template.header", "template.footer"] } },
    }),
    prisma.setting.findMany({
      where: { key: { in: TEMPLATE_VARIABLES.map((v) => v.key) } },
    }),
  ]);
  const header = templateRows.find((r) => r.key === "template.header")?.value ?? "";
  const footer = templateRows.find((r) => r.key === "template.footer")?.value ?? "";
  // Build a flat `Record<key, value>` for the picker dialog hints and for
  // the preview substitution. Missing keys are simply absent.
  const variables: Record<string, string> = Object.fromEntries(
    variableRows.map((r) => [r.key, r.value ?? ""]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modèles d'impression"
        description="Définissez l'en-tête et le pied de page affichés sur les documents imprimés (devis, commandes, factures, ...)."
      />
      <TemplatesForm initialHeader={header} initialFooter={footer} variables={variables} />
    </div>
  );
}
