export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import {
  ModulesSettingsForm,
  type ModuleSectionDef,
} from "@/components/admin/modules-settings-form";

// Settings belonging to the "modules" area are stored in the `settings` table
// with their `category` column set to the matching section id (quotations,
// orders, invoices, ...). Adding a new section only requires:
//   1. Adding an entry to MODULE_SECTIONS below.
//   2. Seeding its keys with the matching `category`.
const MODULE_SECTIONS: ModuleSectionDef[] = [
  {
    id: "quotations",
    title: "Devis",
    description: "Options du module Devis.",
    settings: [
      {
        key: "quotations.remise_exists",
        label: "Activer la remise",
        type: "boolean",
        helpText: "Permet de saisir un taux de remise sur les lignes des devis.",
      },
      {
        key: "quotations.confirmed_by_default",
        label: "Confirmer par défaut à la création",
        type: "boolean",
        helpText: "Si activé, les nouveaux devis sont créés directement avec le statut « Confirmé » au lieu de « Brouillon ».",
      },
      {
        key: "quotations.validity_offer_days",
        label: "Validité de l'offre (jours)",
        type: "number",
        helpText: "Nombre de jours ajoutés à la date de création pour calculer automatiquement la date d'expiration du devis.",
      },
    ],
  },
  {
    id: "orders",
    title: "Ventes",
    description: "Options du module Ventes (commandes clients).",
    settings: [
      {
        key: "orders.remise_exists",
        label: "Activer la remise",
        type: "boolean",
        helpText: "Permet de saisir un taux de remise sur les lignes des commandes.",
      },
      {
        key: "orders.confirmed_by_default",
        label: "Confirmer par défaut à la création",
        type: "boolean",
        helpText: "Si activé, les nouvelles commandes sont créées directement avec le statut « Confirmé » et les mouvements de stock sont générés immédiatement.",
      },
      {
        key: "payments.display",
        label: "Affichage des paiements",
        type: "select",
        helpText: "Définit le mode d'affichage par défaut de l'onglet Paiements sur les nouvelles commandes. Chaque commande peut ensuite surcharger cette valeur dans ses paramètres.",
        options: [
          { value: "hide", label: "Masquer" },
          { value: "payments_only", label: "Paiements seulement" },
          { value: "payments_and_debts", label: "Paiements et dettes" },
        ],
      },
    ],
  },
  {
    id: "invoices",
    title: "Factures",
    description: "Options du module Factures.",
    settings: [
      {
        key: "invoices.remise_exists",
        label: "Activer la remise",
        type: "boolean",
        helpText: "Permet de saisir un taux de remise sur les lignes des factures.",
      },
      {
        key: "invoices.confirmed_by_default",
        label: "Confirmer par défaut à la création",
        type: "boolean",
        helpText: "Si activé, les nouvelles factures sont créées directement avec le statut « Confirmé » au lieu de « Brouillon ».",
      },
      {
        key: "invoices.show_in_sidebar",
        label: "Afficher dans le menu latéral",
        type: "boolean",
        helpText: "Si désactivé, l'entrée « Factures » du menu latéral est masquée pour tous les utilisateurs. Les utilisateurs autorisés peuvent toujours accéder aux factures via l'URL directe.",
      },
    ],
  },
  {
    id: "purchases",
    title: "Achats",
    description: "Options du module Achats (achats fournisseurs).",
    settings: [
      {
        key: "purchases.remise_exists",
        label: "Activer la remise",
        type: "boolean",
        helpText: "Permet de saisir un taux de remise sur les lignes des achats.",
      },
      {
        key: "purchases.confirmed_by_default",
        label: "Confirmer par défaut à la création",
        type: "boolean",
        helpText: "Si activé, les nouveaux achats sont créés directement avec le statut « Confirmé » et les mouvements de stock (entrées) ainsi que la mise à jour du prix d'achat sont effectués immédiatement.",
      },
    ],
  },
];

/** Module slugs that should expose the "Modèle de numérotation" editor. */
const NUMBERED_SLUGS = new Set([
  "quotations",
  "orders",
  "invoices",
  "purchases",
  "stock_transfers",
  "stock_adjustments",
  "payments_clients",
  "payments_suppliers",
]);

export default async function ModulesSettingsPage() {
  await requirePermission("settings.view");

  const sectionIds = MODULE_SECTIONS.map((s) => s.id);
  const [rows, modules] = await Promise.all([
    prisma.setting.findMany({
      where: { category: { in: sectionIds } },
      orderBy: { key: "asc" },
    }),
    prisma.module.findMany({
      where: { slug: { in: Array.from(NUMBERED_SLUGS) } },
      select: { slug: true, namingDoc: true, nextNumber: true },
    }),
  ]);

  const namingBySlug = new Map(modules.map((m) => [m.slug, m]));
  const sectionsWithNaming: ModuleSectionDef[] = MODULE_SECTIONS.map((s) => {
    if (!NUMBERED_SLUGS.has(s.id)) return s;
    const m = namingBySlug.get(s.id);
    return {
      ...s,
      naming: {
        value: m?.namingDoc ?? "",
        nextNumber: m?.nextNumber ?? 1,
      },
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres des modules"
        description="Activez ou désactivez les options de chaque module et configurez la numérotation des documents."
      />
      <ModulesSettingsForm sections={sectionsWithNaming} initialSettings={rows} />
    </div>
  );
}
