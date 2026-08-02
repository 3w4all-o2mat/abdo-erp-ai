import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Module slug → { name, namingDoc }
const MODULES: Record<string, { name: string; namingDoc: string }> = {
  quotations: { name: "Devis", namingDoc: "DEV/{year}/{seq}" },
  orders: { name: "Commandes", namingDoc: "CMD/{year}/{seq}" },
  invoices: { name: "Factures", namingDoc: "FAC/{year}/{seq}" },
  purchases: { name: "Achats", namingDoc: "ACH/{year}/{seq}" },
  stock_transfers: { name: "Transferts", namingDoc: "TRF/{year}/{seq}" },
  stock_adjustments: { name: "Ajustements", namingDoc: "ADJ/{year}/{seq}" },
  payments_clients: { name: "Paiements clients", namingDoc: "PAC/{year}/{seq}" },
  payments_suppliers: { name: "Paiements fournisseurs", namingDoc: "PAF/{year}/{seq}" },
};

// Permission definitions: slug → { name, module }
const PERMISSIONS: Array<{ slug: string; name: string; module: string }> = [
  // Dashboard
  { slug: "dashboard.view", name: "Voir le tableau de bord", module: "dashboard" },
  // Users
  { slug: "users.view", name: "Voir les utilisateurs", module: "users" },
  { slug: "users.create", name: "Créer un utilisateur", module: "users" },
  { slug: "users.update", name: "Modifier un utilisateur", module: "users" },
  { slug: "users.delete", name: "Supprimer un utilisateur", module: "users" },
  // Roles
  { slug: "roles.view", name: "Voir les rôles", module: "roles" },
  { slug: "roles.create", name: "Créer un rôle", module: "roles" },
  { slug: "roles.update", name: "Modifier un rôle", module: "roles" },
  { slug: "roles.delete", name: "Supprimer un rôle", module: "roles" },
  // Products
  { slug: "products.view", name: "Voir les produits", module: "products" },
  { slug: "products.create", name: "Créer un produit", module: "products" },
  { slug: "products.update", name: "Modifier un produit", module: "products" },
  { slug: "products.delete", name: "Supprimer un produit", module: "products" },
  // Categories
  { slug: "categories.view", name: "Voir les catégories", module: "categories" },
  { slug: "categories.manage", name: "Gérer les catégories", module: "categories" },
  // Clients
  { slug: "clients.view", name: "Voir les clients", module: "clients" },
  { slug: "clients.create", name: "Créer un client", module: "clients" },
  { slug: "clients.update", name: "Modifier un client", module: "clients" },
  { slug: "clients.delete", name: "Supprimer un client", module: "clients" },
  // Suppliers
  { slug: "suppliers.view", name: "Voir les fournisseurs", module: "suppliers" },
  { slug: "suppliers.create", name: "Créer un fournisseur", module: "suppliers" },
  { slug: "suppliers.update", name: "Modifier un fournisseur", module: "suppliers" },
  { slug: "suppliers.delete", name: "Supprimer un fournisseur", module: "suppliers" },
  // Quotations
  { slug: "quotations.view", name: "Voir les devis", module: "quotations" },
  { slug: "quotations.create", name: "Créer un devis", module: "quotations" },
  { slug: "quotations.update", name: "Modifier un devis", module: "quotations" },
  { slug: "quotations.delete", name: "Supprimer un devis", module: "quotations" },
  { slug: "quotations.confirm", name: "Confirmer un devis", module: "quotations" },
  { slug: "quotations.cancel", name: "Annuler un devis", module: "quotations" },
  // Orders
  { slug: "orders.view", name: "Voir les commandes", module: "orders" },
  { slug: "orders.create", name: "Créer une commande", module: "orders" },
  { slug: "orders.update", name: "Modifier une commande", module: "orders" },
  { slug: "orders.delete", name: "Supprimer une commande", module: "orders" },
  { slug: "orders.confirm", name: "Confirmer une commande", module: "orders" },
  { slug: "orders.cancel", name: "Annuler une commande", module: "orders" },
  // Invoices
  { slug: "invoices.view", name: "Voir les factures", module: "invoices" },
  { slug: "invoices.create", name: "Créer une facture", module: "invoices" },
  { slug: "invoices.update", name: "Modifier une facture", module: "invoices" },
  { slug: "invoices.delete", name: "Supprimer une facture", module: "invoices" },
  { slug: "invoices.confirm", name: "Confirmer une facture", module: "invoices" },
  { slug: "invoices.cancel", name: "Annuler une facture", module: "invoices" },
  // Purchases
  { slug: "purchases.view", name: "Voir les achats", module: "purchases" },
  { slug: "purchases.create", name: "Créer un achat", module: "purchases" },
  { slug: "purchases.update", name: "Modifier un achat", module: "purchases" },
  { slug: "purchases.delete", name: "Supprimer un achat", module: "purchases" },
  { slug: "purchases.confirm", name: "Confirmer un achat", module: "purchases" },
  { slug: "purchases.cancel", name: "Annuler un achat", module: "purchases" },
  // Stock
  { slug: "stocks.view", name: "Voir les stocks", module: "stocks" },
  { slug: "stocks.manage", name: "Gérer les stocks", module: "stocks" },
  { slug: "stock_transfers.view", name: "Voir les transferts", module: "stock_transfers" },
  { slug: "stock_transfers.create", name: "Créer un transfert", module: "stock_transfers" },
  { slug: "stock_transfers.confirm", name: "Confirmer un transfert", module: "stock_transfers" },
  { slug: "stock_adjustments.view", name: "Voir les ajustements", module: "stock_adjustments" },
  { slug: "stock_adjustments.create", name: "Créer un ajustement", module: "stock_adjustments" },
  { slug: "stock_adjustments.confirm", name: "Confirmer un ajustement", module: "stock_adjustments" },
  { slug: "stock_movements.view", name: "Voir les mouvements de stock", module: "stocks" },
  // Payments
  { slug: "payments_clients.view", name: "Voir les paiements clients", module: "payments_clients" },
  { slug: "payments_clients.create", name: "Encaisser un paiement client", module: "payments_clients" },
  { slug: "payments_clients.delete", name: "Supprimer un paiement client", module: "payments_clients" },
  { slug: "payments_suppliers.view", name: "Voir les paiements fournisseurs", module: "payments_suppliers" },
  { slug: "payments_suppliers.create", name: "Payer un fournisseur", module: "payments_suppliers" },
  { slug: "payments_suppliers.delete", name: "Supprimer un paiement fournisseur", module: "payments_suppliers" },
  // Expenses
  { slug: "expenses.view", name: "Voir les dépenses", module: "expenses" },
  { slug: "expenses.create", name: "Créer une dépense", module: "expenses" },
  { slug: "expenses.delete", name: "Supprimer une dépense", module: "expenses" },
  { slug: "expense_categories.manage", name: "Gérer les catégories de dépenses", module: "expenses" },
  // Settings
  { slug: "settings.view", name: "Voir les paramètres", module: "settings" },
  { slug: "settings.manage", name: "Gérer les paramètres", module: "settings" },
  // Content (CMS)
  { slug: "content.view", name: "Voir le contenu public", module: "content" },
  { slug: "content.manage", name: "Gérer le contenu public", module: "content" },
  // Audit
  { slug: "audit.view", name: "Voir le journal d'audit", module: "audit" },
  // Product specifications
  { slug: "product_zones.view", name: "Voir les zones", module: "products" },
  { slug: "product_zones.manage", name: "Gérer les zones", module: "products" },
  { slug: "product_marques_maison.view", name: "Voir les marques maison", module: "products" },
  { slug: "product_marques_maison.manage", name: "Gérer les marques maison", module: "products" },
  { slug: "product_moteurs.view", name: "Voir les moteurs", module: "products" },
  { slug: "product_moteurs.manage", name: "Gérer les moteurs", module: "products" },
  { slug: "product_types_moteur.view", name: "Voir les types de moteur", module: "products" },
  { slug: "product_types_moteur.manage", name: "Gérer les types de moteur", module: "products" },
  { slug: "product_marques_filtre.view", name: "Voir les marques de filtre", module: "products" },
  { slug: "product_marques_filtre.manage", name: "Gérer les marques de filtre", module: "products" },
];

// Modules that need a numbering document (for reference generation)
const NUMBERED_MODULES = [
  { slug: "dashboard", name: "Tableau de bord", namingDoc: "" },
  { slug: "users", name: "Utilisateurs", namingDoc: "" },
  { slug: "roles", name: "Rôles & Permissions", namingDoc: "" },
  { slug: "products", name: "Produits", namingDoc: "" },
  { slug: "categories", name: "Catégories", namingDoc: "" },
  { slug: "clients", name: "Clients", namingDoc: "" },
  { slug: "suppliers", name: "Fournisseurs", namingDoc: "" },
  { slug: "stocks", name: "Stocks", namingDoc: "" },
  { slug: "expenses", name: "Dépenses", namingDoc: "" },
  { slug: "settings", name: "Paramètres", namingDoc: "" },
  { slug: "content", name: "Contenu public", namingDoc: "" },
  { slug: "audit", name: "Journal d'audit", namingDoc: "" },
  ...Object.entries(MODULES).map(([slug, v]) => ({ slug, name: v.name, namingDoc: v.namingDoc })),
];

const WILAYAS: Array<{ id: number; codew: string; name: string }> = [
  { id: 1, codew: "01", name: "Adrar" },
  { id: 2, codew: "02", name: "Chlef" },
  { id: 3, codew: "03", name: "Laghouat" },
  { id: 4, codew: "04", name: "Oum El Bouaghi" },
  { id: 5, codew: "05", name: "Batna" },
  { id: 6, codew: "06", name: "Béjaïa" },
  { id: 7, codew: "07", name: "Biskra" },
  { id: 8, codew: "08", name: "Béchar" },
  { id: 9, codew: "09", name: "Blida" },
  { id: 10, codew: "10", name: "Bouira" },
  { id: 11, codew: "11", name: "Tamanrasset" },
  { id: 12, codew: "12", name: "Tébessa" },
  { id: 13, codew: "13", name: "Tlemcen" },
  { id: 14, codew: "14", name: "Tiaret" },
  { id: 15, codew: "15", name: "Tizi Ouzou" },
  { id: 16, codew: "16", name: "Alger" },
  { id: 17, codew: "17", name: "Djelfa" },
  { id: 18, codew: "18", name: "Jijel" },
  { id: 19, codew: "19", name: "Sétif" },
  { id: 20, codew: "20", name: "Saïda" },
  { id: 21, codew: "21", name: "Skikda" },
  { id: 22, codew: "22", name: "Sidi Bel Abbès" },
  { id: 23, codew: "23", name: "Annaba" },
  { id: 24, codew: "24", name: "Guelma" },
  { id: 25, codew: "25", name: "Constantine" },
  { id: 26, codew: "26", name: "Médéa" },
  { id: 27, codew: "27", name: "Mostaganem" },
  { id: 28, codew: "28", name: "M'Sila" },
  { id: 29, codew: "29", name: "Mascara" },
  { id: 30, codew: "30", name: "Ouargla" },
  { id: 31, codew: "31", name: "Oran" },
  { id: 32, codew: "32", name: "El Bayadh" },
  { id: 33, codew: "33", name: "Illizi" },
  { id: 34, codew: "34", name: "Bordj Bou Arréridj" },
  { id: 35, codew: "35", name: "Boumerdès" },
  { id: 36, codew: "36", name: "El Tarf" },
  { id: 37, codew: "37", name: "Tindouf" },
  { id: 38, codew: "38", name: "Tissemsilt" },
  { id: 39, codew: "39", name: "El Oued" },
  { id: 40, codew: "40", name: "Khenchela" },
  { id: 41, codew: "41", name: "Souk Ahras" },
  { id: 42, codew: "42", name: "Tipaza" },
  { id: 43, codew: "43", name: "Mila" },
  { id: 44, codew: "44", name: "Aïn Defla" },
  { id: 45, codew: "45", name: "Naâma" },
  { id: 46, codew: "46", name: "Aïn Témouchent" },
  { id: 47, codew: "47", name: "Ghardaïa" },
  { id: 48, codew: "48", name: "Relizane" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Modules. On `update` we deliberately do NOT overwrite `namingDoc` so
  // that an admin who has customised the numbering pattern via the settings
  // page keeps their value when the seed is re-run. The pattern from the
  // `NUMBERED_MODULES` map is only used when the row is first created.
  for (const m of NUMBERED_MODULES) {
    await prisma.module.upsert({
      where: { slug: m.slug },
      update: { name: m.name },
      create: { slug: m.slug, name: m.name, namingDoc: m.namingDoc || "", nextNumber: 1 },
    });
  }

  // 2. Permissions
  for (const p of PERMISSIONS) {
    const mod = await prisma.module.findUnique({ where: { slug: p.module } });
    if (!mod) continue;
    await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { name: p.name, moduleId: mod.id },
      create: { slug: p.slug, name: p.name, moduleId: mod.id },
    });
  }

  // 3. Roles
  const allPerms = await prisma.permission.findMany();
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: { description: "Accès complet au système" },
    create: { name: "Admin", description: "Accès complet au système" },
  });
  // Admin gets all permissions
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPerms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const salesRole = await prisma.role.upsert({
    where: { name: "Ventes" },
    update: { description: "Équipe commercial" },
    create: { name: "Ventes", description: "Équipe commercial" },
  });
  const salesPerms = allPerms.filter((p) =>
    ["dashboard.view", "clients.view", "clients.create", "clients.update", "products.view",
     "quotations.view", "quotations.create", "quotations.update", "quotations.confirm", "quotations.cancel",
     "orders.view", "orders.create", "orders.update", "orders.confirm", "orders.cancel",
     "invoices.view", "invoices.create", "invoices.update", "invoices.confirm", "invoices.cancel",
     "payments_clients.view", "payments_clients.create", "stocks.view", "stock_movements.view"].includes(p.slug),
  );
  await prisma.rolePermission.deleteMany({ where: { roleId: salesRole.id } });
  await prisma.rolePermission.createMany({
    data: salesPerms.map((p) => ({ roleId: salesRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: "Caissier" },
    update: { description: "Encaissement et facturation" },
    create: { name: "Caissier", description: "Encaissement et facturation" },
  });
  const cashierPerms = allPerms.filter((p) =>
    ["dashboard.view", "clients.view", "clients.create", "products.view",
     "invoices.view", "invoices.create", "invoices.confirm",
     "payments_clients.view", "payments_clients.create", "stocks.view"].includes(p.slug),
  );
  await prisma.rolePermission.deleteMany({ where: { roleId: cashierRole.id } });
  await prisma.rolePermission.createMany({
    data: cashierPerms.map((p) => ({ roleId: cashierRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const warehouseRole = await prisma.role.upsert({
    where: { name: "Magasinier" },
    update: { description: "Gestion du stock" },
    create: { name: "Magasinier", description: "Gestion du stock" },
  });
  const warehousePerms = allPerms.filter((p) =>
    ["dashboard.view", "products.view", "products.update", "stocks.view", "stocks.manage",
     "stock_transfers.view", "stock_transfers.create", "stock_transfers.confirm",
     "stock_adjustments.view", "stock_adjustments.create", "stock_adjustments.confirm",
     "stock_movements.view",
     "purchases.view", "purchases.create", "purchases.update", "purchases.confirm"].includes(p.slug),
  );
  await prisma.rolePermission.deleteMany({ where: { roleId: warehouseRole.id } });
  await prisma.rolePermission.createMany({
    data: warehousePerms.map((p) => ({ roleId: warehouseRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // 4. Default stock
  let mainStock = await prisma.stock.findFirst({ where: { name: "Stock principal" } });
  if (!mainStock) {
    mainStock = await prisma.stock.create({
      data: { name: "Stock principal", address: "Alger, Algérie", isDefault: true },
    });
  }

  // 5. Admin user
  const hashed = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashed,
      fullName: "Administrateur",
      email: "admin@mini-erp.local",
      phone: "+213 000 000 000",
      isActive: true,
      defaultStockId: mainStock.id,
      roles: { create: [{ roleId: adminRole.id }] },
      stockUsers: { create: [{ stockId: mainStock.id }] },
    },
  });

  // 6. Settings
  const settings = [
    { key: "company.name", value: "Grand Souffle", category: "company", sequence: 1 },
    { key: "company.address", value: "Boumerdes, Algérie", category: "company", sequence: 2 },
    { key: "company.phone", value: "+213 000 000 000", category: "company", sequence: 3 },
    { key: "company.email", value: "contact@grandsouffle.com", category: "company", sequence: 4 },
    { key: "company.tax_id", value: "NIF 000000000000000", category: "company", sequence: 5 },
    { key: "company.vat_enabled", value: "true", category: "company", sequence: 6 },
    { key: "company.vat_rate", value: "19", category: "company", sequence: 7 },
    { key: "company.currency", value: "Dz", category: "company", sequence: 8 },
    { key: "template.header", value: "", category: "template", sequence: 1 },
    { key: "template.footer", value: "", category: "template", sequence: 2 },
    { key: "quotations.remise_exists", value: "true", category: "quotations", sequence: 1 },
    { key: "quotations.confirmed_by_default", value: "false", category: "quotations", sequence: 2 },
    { key: "quotations.validity_offer_days", value: "60", category: "quotations", sequence: 3 },
    { key: "orders.confirmed_by_default", value: "false", category: "orders", sequence: 1 },
    { key: "payments.display", value: "hide", category: "orders", sequence: 3 },
    { key: "purchases.remise_exists", value: "true", category: "purchases", sequence: 1 },
    { key: "purchases.confirmed_by_default", value: "false", category: "purchases", sequence: 2 },
    { key: "invoices.confirmed_by_default", value: "false", category: "invoices", sequence: 1 },
    { key: "invoices.show_in_sidebar", value: "true", category: "invoices", sequence: 2 },
    { key: "site.title", value: "Grand Souffle — Mini ERP", category: "site", sequence: 1 },
    { key: "site.tagline", value: "Gestion d'entreprise simple et efficace", category: "site", sequence: 2 },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 7. Content blocks (CMS)
  const blocks = [
    { slug: "hero_title", title: "Titre principal", body: "Bienvenue chez Mon Entreprise" },
    { slug: "hero_subtitle", title: "Sous-titre principal", body: "Votre partenaire de confiance pour des solutions adaptées à vos besoins." },
    { slug: "about", title: "À propos", body: "Mon Entreprise est une société spécialisée dans la distribution de produits de qualité. Notre engagement : satisfaction client et service de proximité." },
    { slug: "services", title: "Nos services", body: "Nous proposons une gamme complète de produits et services pour les professionnels et les particuliers." },
    { slug: "contact", title: "Contact", body: "Contactez-nous pour toute demande d'information." },
  ];
  for (const b of blocks) {
    await prisma.contentBlock.upsert({
      where: { slug: b.slug },
      update: { title: b.title, body: b.body },
      create: b,
    });
  }

  // 8. Expense categories
  for (const name of ["Loyer", "Salaires", "Électricité", "Transport", "Fournitures", "Autre"]) {
    const existing = await prisma.expenseCategory.findFirst({ where: { name } });
    if (!existing) await prisma.expenseCategory.create({ data: { name } });
  }

  // 9. Wilayas
  for (const w of WILAYAS) {
    await prisma.wilaya.upsert({
      where: { id: w.id },
      update: { codew: w.codew, name: w.name },
      create: w,
    });
  }
  // One commune per wilaya (capital)
  for (const w of WILAYAS) {
    const existing = await prisma.commune.findFirst({ where: { wilayaId: w.id, name: w.name } });
    if (!existing) {
      await prisma.commune.create({ data: { wilayaId: w.id, name: w.name } });
    }
  }

  // 10. Sample product category + product
  let cat = await prisma.productCategory.findFirst({ where: { name: "Général" } });
  if (!cat) cat = await prisma.productCategory.create({ data: { name: "Général" } });
  const sampleProduct = await prisma.product.findUnique({ where: { sku: "PROD-001" } });
  if (!sampleProduct) {
    const product = await prisma.product.create({
      data: {
        sku: "PROD-001",
        name: "Produit exemple",
        displayName: "Produit exemple",
        productCategoryId: cat.id,
        unitOfMeasure: "pcs",
        costPrice: 700,
      },
    });
    const p = await prisma.productPrice.create({
      data: { productId: product.id, name: "Prix standard", unitPrice: 1000 },
    });
    await prisma.product.update({ where: { id: product.id }, data: { currentPriceId: p.id } });
  }

  console.log("✅ Seed complete");
  console.log(`   Admin user: admin / admin123`);
  console.log(`   Default stock: ${mainStock.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });