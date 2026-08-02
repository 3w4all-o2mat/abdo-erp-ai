import type { SessionUser } from "@/lib/rbac";

// Icons are referenced by string name to avoid passing React components
// (functions) from Server Components to Client Components.
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  /**
   * Optional setting key. When the corresponding setting value is `"false"`,
   * the item is hidden from the sidebar for every user (including Admin).
   * Used to let admins toggle module visibility from the module settings
   * page without touching code. Items without a `settingKey` are never
   * affected by this gate.
   */
  settingKey?: string;
  children?: NavItem[];
};

export type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", permission: "dashboard.view" },
    ],
  },
  {
    title: "Ventes",
    items: [
      { label: "Devis", href: "/admin/quotations", icon: "FileText", permission: "quotations.view" },
      { label: "Commandes", href: "/admin/orders", icon: "ShoppingCart", permission: "orders.view" },
      { label: "Factures", href: "/admin/invoices", icon: "Receipt", permission: "invoices.view", settingKey: "invoices.show_in_sidebar" },
      { label: "Clients", href: "/admin/clients", icon: "Users2", permission: "clients.view" },
    ],
  },
  {
    title: "Achats & Stock",
    items: [
      { label: "Achats", href: "/admin/purchases", icon: "ShoppingCart", permission: "purchases.view" },
      { label: "Fournisseurs", href: "/admin/suppliers", icon: "Truck", permission: "suppliers.view" },
      { label: "Produits", href: "/admin/products", icon: "Package", permission: "products.view" },
      { label: "Catégories", href: "/admin/categories", icon: "FolderTree", permission: "categories.view" },
      {
        label: "Spécifications",
        href: "/admin/product-zones",
        icon: "Layers",
        permission: "product_zones.view",
        children: [
          { label: "Zones", href: "/admin/product-zones", icon: "Map", permission: "product_zones.view" },
          { label: "Marques maison", href: "/admin/product-marques-maison", icon: "Tag", permission: "product_marques_maison.view" },
          { label: "Moteurs", href: "/admin/product-moteurs", icon: "Cog", permission: "product_moteurs.view" },
          { label: "Types de moteur", href: "/admin/product-types-moteur", icon: "Cpu", permission: "product_types_moteur.view" },
          { label: "Marques de filtre", href: "/admin/product-marques-filtre", icon: "Filter", permission: "product_marques_filtre.view" },
        ],
      },
      {
        label: "Stocks",
        href: "/admin/stocks",
        icon: "Warehouse",
        permission: "stocks.view",
        children: [
          { label: "Liste de stocks", href: "/admin/stocks", icon: "Warehouse", permission: "stocks.view" },
          { label: "Mouvements", href: "/admin/stock-movements", icon: "Activity", permission: "stock_movements.view" },
          { label: "Transferts", href: "/admin/stock-transfers", icon: "ArrowLeftRight", permission: "stock_transfers.view" },
          { label: "Ajustements", href: "/admin/stock-adjustments", icon: "SlidersHorizontal", permission: "stock_adjustments.view" },
        ],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Finance",
        href: "/admin/payments/clients",
        icon: "CircleDollarSign",
        children: [
          { label: "Paiements clients", href: "/admin/payments/clients", icon: "Wallet", permission: "payments_clients.view" },
          { label: "Paiements fournisseurs", href: "/admin/payments/suppliers", icon: "ReceiptText", permission: "payments_suppliers.view" },
          {
            label: "Dépenses",
            href: "/admin/expenses",
            icon: "Wallet",
            permission: "expenses.view",
            children: [
              { label: "Toutes les dépenses", href: "/admin/expenses", icon: "Wallet", permission: "expenses.view" },
              { label: "Catégories", href: "/admin/expenses/categories", icon: "FolderTree", permission: "expenses.view" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Administration",
        href: "/admin/users",
        icon: "UserCog",
        children: [
          { label: "Utilisateurs", href: "/admin/users", icon: "Users", permission: "users.view" },
          { label: "Rôles & Permissions", href: "/admin/roles", icon: "ShieldCheck", permission: "roles.view" },
          { label: "Contenu public", href: "/admin/content", icon: "FileEdit", permission: "content.view" },
          { label: "Journal d'audit", href: "/admin/audit", icon: "History", permission: "audit.view" },
        ],
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: "Settings",
        permission: "settings.view",
        children: [
          { label: "Informations", href: "/admin/settings", icon: "Info", permission: "settings.view" },
          { label: "Modules", href: "/admin/settings/modules", icon: "Boxes", permission: "settings.view" },
          { label: "Modèles", href: "/admin/templates", icon: "LayoutTemplate", permission: "settings.view" },
        ],
      },
    ],
  },
];

/**
 * Filters the navigation tree based on the current user's permissions and the
 * provided set of "hidden" setting keys. An item is hidden when:
 *   - the user lacks the required permission (and is not an Admin), or
 *   - the item has a `settingKey` that is present in `hiddenSettings`.
 *
 * Sections with no remaining items are dropped so the sidebar never renders
 * an empty heading.
 */
export function filterNav(
  sections: NavSection[],
  user: SessionUser | null,
  hiddenSettings: Set<string> = new Set(),
): NavSection[] {
  const passes = (i: NavItem) =>
    (!i.permission || user?.roles.includes("Admin") || user?.permissions.includes(i.permission)) &&
    !(i.settingKey && hiddenSettings.has(i.settingKey));

  return sections
    .map((s) => ({
      ...s,
      items: s.items
        .filter(passes)
        .map((i) =>
          i.children
            ? { ...i, children: i.children.filter(passes) }
            : i,
        ),
    }))
    .filter((s) => s.items.length > 0);
}

export const PUBLIC_NAV = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/about" },
  { label: "Produits", href: "/products" },
  { label: "Contact", href: "/contact" },
];

export const BRAND_ICON = "Building2";