"use client";
import * as React from "react";
import Link from "next/link";
import { DataTable, type Column, type EntityFilter } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { confirmDocument, cancelDocument, deleteRecord } from "@/lib/actions";
import { deleteClient } from "@/lib/actions/clients";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { formatDate, formatMoney, formatNumber, formatDateTime, initials } from "@/lib/utils";
import { useSettingsCurrency } from "@/components/providers/settings-provider";
import { Settings, CheckCircle2, XCircle, Trash2, Eye, Pencil, Plus, FolderTree, ShieldCheck, Warehouse, MapPin } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientFormDialog } from "@/components/admin/client-form";
import { SupplierFormDialog } from "@/components/admin/supplier-form";

export interface TableRow {
  id: string;
}

export interface TableConfig<T extends TableRow> {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  title: string;
  countLabel: string;
  newHref?: string;
  newButton?: React.ReactNode;
  showHeader?: boolean;
  entity?: string;
  editBase?: string;
  deletePerm?: string;
  statusKey?: keyof T;
  partnerKey?: keyof T;
  dateKey?: keyof T;
  totalKey?: keyof T;
  /** Optional generic column-based filter (rendered as a Select above the table). */
  entityFilter?: EntityFilter<T>;
}

export function AdminTable<T extends TableRow>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
  emptyMessage = "Aucune donnée",
  title,
  countLabel,
  newHref,
  newButton,
  showHeader = true,
  entity,
  editBase,
  deletePerm,
  statusKey,
  partnerKey,
  dateKey,
  totalKey,
  entityFilter,
}: TableConfig<T>) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{countLabel}</p>
          </div>
          {newButton ? newButton : newHref && (
            <a href={newHref}>
              <Button><Plus className="h-4 w-4" /> Nouveau</Button>
            </a>
          )}
        </div>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={searchKeys}
        searchPlaceholder={searchPlaceholder}
        pageSize={pageSize}
        emptyMessage={emptyMessage}
        entityFilter={entityFilter}
      />
    </div>
  );
}

// ============================================
// Specialized table components for each module
// ============================================

// Clients Table
export interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wilaya: { name: string } | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function ClientsTable({ rows, wilayas }: { rows: ClientRow[]; wilayas: { id: number; name: string; codew: string | null }[] }) {
  const columns: Column<ClientRow>[] = React.useMemo(() => [
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Téléphone", cell: (r) => r.phone ?? "—" },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
    { key: "wilaya", header: "Wilaya", cell: (r) => r.wilaya?.name ?? "—" },
    { key: "taxId", header: "NIF", cell: (r) => r.taxId ?? "—" },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    { key: "createdAt", header: "Créé le", sortable: true, sortValue: (r) => r.createdAt.getTime(), cell: (r) => formatDate(r.createdAt) },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><Settings className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ClientFormDialog client={r as unknown as Parameters<typeof ClientFormDialog>[0]["client"]} wilayas={wilayas} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>} />
            <ConfirmDialog title="Supprimer ce client ?" description="Cette action est irréversible." onConfirm={() => deleteClient(r.id)}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) },
  ], [wilayas]);

  return <AdminTable columns={columns} rows={rows} searchKeys={["name", "phone", "email"]} searchPlaceholder="Rechercher un client..." title="Clients" countLabel={`${rows.length} client(s)`}
    newButton={<ClientFormDialog trigger={<Button><Plus className="h-4 w-4" /> Nouveau client</Button>} wilayas={wilayas} />}
  />;
}

// Suppliers Table
export interface SupplierRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wilaya: { name: string } | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function SuppliersTable({ rows, wilayas }: { rows: SupplierRow[]; wilayas: { id: number; name: string; codew: string | null }[] }) {
  const columns: Column<SupplierRow>[] = React.useMemo(() => [
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Téléphone", cell: (r) => r.phone ?? "—" },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
    { key: "wilaya", header: "Wilaya", cell: (r) => r.wilaya?.name ?? "—" },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    { key: "createdAt", header: "Créé le", sortable: true, sortValue: (r) => r.createdAt.getTime(), cell: (r) => formatDate(r.createdAt) },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><Settings className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <SupplierFormDialog supplier={r as unknown as Parameters<typeof SupplierFormDialog>[0]["supplier"]} wilayas={wilayas} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>} />
            <ConfirmDialog title="Supprimer ce fournisseur ?" description="Cette action est irréversible." onConfirm={() => deleteSupplier(r.id)}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) },
  ], []);

  return <AdminTable columns={columns} rows={rows} searchKeys={["name", "phone", "email"]} searchPlaceholder="Rechercher un fournisseur..." title="Fournisseurs" countLabel={`${rows.length} fournisseur(s)`} showHeader={false} />;
}

// Products Table
export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: { name: string } | null;
  currentPrice: { unitPrice: number } | null;
  unitOfMeasure: string;
  isActive: boolean;
  image?: string | null;
  moteur?: { name: string } | null;
  marqueFiltre?: { name: string } | null;
  marquesMaisons?: { name: string }[];
}

export function ProductsTable({ rows, categories, stockByProduct, showHeader = true }: { rows: ProductRow[]; categories: { id: string; name: string }[]; stockByProduct: Map<string, number>; showHeader?: boolean }) {
  const currency = useSettingsCurrency();
  const columns: Column<ProductRow>[] = React.useMemo(() => [
    {
      key: "image",
      header: "",
      width: "48px",
      cell: (r) => r.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.image} alt="" className="h-9 w-9 rounded-md border object-cover" />
      ) : (
        <div className="h-9 w-9 rounded-md border bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">—</div>
      ),
    },
    { key: "sku", header: "SKU", sortable: true, sortValue: (r) => r.sku, cell: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "name", header: "Nom", sortable: true, sortValue: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "category", header: "Catégorie", cell: (r) => r.category?.name ?? "—" },
    { key: "moteur", header: "Moteur", cell: (r) => r.moteur?.name ?? "—" },
    { key: "marqueFiltre", header: "Marque filtre", cell: (r) => r.marqueFiltre?.name ?? "—" },
    {
      key: "marquesMaisons",
      header: "Marques maison",
      cell: (r) => {
        const items = r.marquesMaisons ?? [];
        if (items.length === 0) return <span className="text-muted-foreground">—</span>;
        const shown = items.slice(0, 2).map((m) => m.name).join(", ");
        const overflow = items.length - 2;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {items.slice(0, 2).map((m, i) => (
              <Badge key={i} variant="secondary" className="font-normal">{m.name}</Badge>
            ))}
            {overflow > 0 && <span className="text-xs text-muted-foreground">+{overflow}</span>}
            {items.length <= 2 && items.length > 0 && !shown.includes(",") && <span className="hidden">{shown}</span>}
          </div>
        );
      },
    },
    { key: "price", header: "Prix vente", sortable: true, sortValue: (r) => r.currentPrice?.unitPrice ?? 0, cell: (r) => formatMoney(r.currentPrice?.unitPrice ?? 0, currency) },
    { key: "stock", header: "Stock", cell: (r) => {
      const qty = stockByProduct.get(r.id) ?? 0;
      return <span className={qty <= 0 ? "text-destructive font-medium" : "font-medium"}>{formatNumber(qty, 0)} {r.unitOfMeasure}</span>;
    } },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><Settings className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href={`/admin/products/${r.id}`}><Pencil className="h-4 w-4" /> Modifier</Link></DropdownMenuItem>
            <ConfirmDialog title="Supprimer ce produit ?" description="Cette action est irréversible." onConfirm={() => deleteRecord("products", r.id, "products.delete")}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) },
  ], [currency]);

  return <div className="overflow-x-auto"><AdminTable columns={columns} rows={rows} searchKeys={["sku", "name"]} searchPlaceholder="Rechercher un produit..." title="Produits" countLabel={`${rows.length} produit(s)`} newHref="/admin/products/new" showHeader={showHeader} /></div>;
}

// Users Table
export interface UserRow {
  id: string;
  fullName: string;
  username: string;
  roles: { role: { id: string; name: string } }[];
  email: string | null;
  lastLogin: Date | null;
  isActive: boolean;
}

export function UsersTable({ rows, roles, stocks }: { rows: UserRow[]; roles: { id: string; name: string }[]; stocks: { id: string; name: string }[] }) {
  const columns: Column<UserRow>[] = React.useMemo(() => [
    { key: "name", header: "Utilisateur", sortable: true, sortValue: (r) => r.fullName, cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarFallback>{initials(r.fullName)}</AvatarFallback></Avatar>
        <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">@{r.username}</p></div>
      </div>
    ) },
    { key: "roles", header: "Rôles", cell: (r) => <div className="flex flex-wrap gap-1">{r.roles.map((ur) => <Badge key={ur.role.id} variant="secondary">{ur.role.name}</Badge>)}</div> },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
    { key: "lastLogin", header: "Dernière connexion", cell: (r) => r.lastLogin ? formatDate(r.lastLogin, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Jamais" },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><Settings className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href={`/admin/users/${r.id}`}><Pencil className="h-4 w-4" /> Modifier</Link></DropdownMenuItem>
            <ConfirmDialog title="Supprimer cet utilisateur ?" description="L'historique sera conservé via le journal d'audit." onConfirm={() => deleteRecord("users", r.id, "users.delete")}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) },
  ], []);

  return <AdminTable columns={columns} rows={rows} searchKeys={["fullName", "username", "email"]} searchPlaceholder="Rechercher un utilisateur..." title="Utilisateurs" countLabel={`${rows.length} utilisateur(s)`} newHref="/admin/users/new" showHeader={false} />;
}

// Audit Table
export interface AuditRow {
  id: string;
  user: { fullName: string } | null;
  action: string;
  entity: string;
  entityId: string | null;
  date: Date;
}

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  created: "success", updated: "default", deleted: "destructive", confirmed: "success", canceled: "warning", login: "secondary",
};
const actionLabel: Record<string, string> = {
  created: "Créé", updated: "Modifié", deleted: "Supprimé", confirmed: "Confirmé", canceled: "Annulé", login: "Connexion",
};

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  const columns: Column<AuditRow>[] = React.useMemo(() => [
    { key: "user", header: "Utilisateur", cell: (r) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{initials(r.user?.fullName)}</AvatarFallback></Avatar>
        <span className="text-sm">{r.user?.fullName ?? "—"}</span>
      </div>
    ) },
    { key: "action", header: "Action", cell: (r) => <Badge variant={actionVariant[r.action] ?? "secondary"}>{actionLabel[r.action] ?? r.action}</Badge> },
    { key: "entity", header: "Entité", cell: (r) => <code className="text-xs">{r.entity}</code> },
    { key: "entityId", header: "ID", cell: (r) => r.entityId ? <code className="text-xs text-muted-foreground">{r.entityId.slice(0, 8)}...</code> : "—" },
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDateTime(r.date) },
  ], []);

  return <AdminTable columns={columns} rows={rows} searchKeys={["entity"]} searchPlaceholder="Rechercher une entité..." title="Journal d'audit" countLabel={`${rows.length} entrée(s) récente(s)`} />;
}

// Expenses Table
export interface ExpenseRow {
  id: string;
  date: Date;
  expenseCategoryId: string | null;
  expenseCategory: { name: string } | null;
  amount: number;
  observation: string | null;
}

export function ExpensesTable({ rows, categories }: { rows: ExpenseRow[]; categories: { id: string; name: string }[] }) {
  const currency = useSettingsCurrency();
  const columns: Column<ExpenseRow>[] = React.useMemo(() => [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDate(r.date) },
    { key: "category", header: "Catégorie", cell: (r) => r.expenseCategory?.name ?? "—" },
    { key: "amount", header: "Montant", sortable: true, sortValue: (r) => r.amount, className: "text-right", cell: (r) => <span className="font-medium text-destructive">{formatMoney(r.amount, currency)}</span> },
    { key: "observation", header: "Observation", cell: (r) => r.observation ?? "—" },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <ConfirmDialog title="Supprimer cette dépense ?" onConfirm={() => deleteRecord("expenses", r.id, "expenses.delete")}>
        <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </ConfirmDialog>
    ) },
  ], [currency]);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={["observation"]}
        searchPlaceholder="Rechercher..."
        pageSize={10}
        emptyMessage="Aucune donnée"
        entityFilter={{ key: "expenseCategoryId", placeholder: "Catégorie", options: categories.map((c) => ({ value: c.id, label: c.name })) }}
        footer={(rs) => {
          const sum = rs.reduce((acc, r) => acc + r.amount, 0);
          return (
            <tr>
              <td colSpan={2} className="text-right text-muted-foreground">Total</td>
              <td className="text-right text-destructive">{formatMoney(sum, currency)}</td>
              <td colSpan={2} />
            </tr>
          );
        }}
      />
    </div>
  );
}

// Payments Clients Table
export interface PaymentClientRow {
  id: string;
  date: Date;
  clientId: string;
  client: { name: string } | null;
  amount: number;
  paymentMethod: string;
  observation: string | null;
}

const METHODS: Record<string, string> = { cash: "Espèces", check: "Chèque", transfer: "Virement" };

export function PaymentsClientsTable({ rows, clients }: { rows: PaymentClientRow[]; clients: { id: string; name: string }[] }) {
  const currency = useSettingsCurrency();
  const columns: Column<PaymentClientRow>[] = React.useMemo(() => [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDate(r.date) },
    { key: "client", header: "Client", cell: (r) => r.client?.name ?? "—" },
    { key: "amount", header: "Montant", sortable: true, sortValue: (r) => r.amount, className: "text-right", cell: (r) => <span className="font-medium">{formatMoney(r.amount, currency)}</span> },
    { key: "method", header: "Méthode", cell: (r) => METHODS[r.paymentMethod] ?? r.paymentMethod },
    { key: "observation", header: "Obs.", cell: (r) => r.observation ?? "—" },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <ConfirmDialog title="Supprimer ce paiement ?" onConfirm={() => deleteRecord("payments_clients", r.id, "payments_clients.delete")}>
        <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </ConfirmDialog>
    ) },
  ], [currency]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      searchKeys={["observation"]}
      searchPlaceholder="Rechercher..."
      title="Paiements clients"
      countLabel={`${rows.length} paiement(s)`}
      newHref="/admin/payments/clients/new"
      showHeader={false}
      entityFilter={{ key: "clientId", placeholder: "Client", options: clients.map((c) => ({ value: c.id, label: c.name })) }}
    />
  );
}

// Payments Suppliers Table
export interface PaymentSupplierRow {
  id: string;
  date: Date;
  supplier: { name: string } | null;
  amount: number;
  paymentMethod: string;
  observation: string | null;
}

export function PaymentsSuppliersTable({ rows, suppliers, showHeader = true }: { rows: PaymentSupplierRow[]; suppliers: { id: string; name: string }[]; showHeader?: boolean }) {
  const currency = useSettingsCurrency();
  const columns: Column<PaymentSupplierRow>[] = React.useMemo(() => [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDate(r.date) },
    { key: "supplier", header: "Fournisseur", cell: (r) => r.supplier?.name ?? "—" },
    { key: "amount", header: "Montant", sortable: true, sortValue: (r) => r.amount, className: "text-right", cell: (r) => <span className="font-medium">{formatMoney(r.amount, currency)}</span> },
    { key: "method", header: "Méthode", cell: (r) => METHODS[r.paymentMethod] ?? r.paymentMethod },
    { key: "observation", header: "Observation", cell: (r) => r.observation ?? "—" },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <ConfirmDialog title="Supprimer ce paiement ?" onConfirm={() => deleteRecord("payments_suppliers", r.id, "payments_suppliers.delete")}>
        <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </ConfirmDialog>
    ) },
  ], [currency]);

  return <AdminTable columns={columns} rows={rows} searchKeys={["observation"]} searchPlaceholder="Rechercher..." title="Paiements fournisseurs" countLabel={`${rows.length} paiement(s)`} newHref="/admin/payments/suppliers/new" showHeader={showHeader} />;
}

// Stock Transfers Table
export interface StockTransferRow {
  id: string;
  date: Date;
  fromStock: { name: string } | null;
  toStock: { name: string } | null;
  lines: { id: string }[];
  status: string;
}

export function StockTransfersTable({ rows }: { rows: StockTransferRow[] }) {
  const columns: Column<StockTransferRow>[] = React.useMemo(() => [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDate(r.date) },
    { key: "from", header: "De", cell: (r) => r.fromStock?.name ?? "—" },
    { key: "to", header: "Vers", cell: (r) => r.toStock?.name ?? "—" },
    { key: "lines", header: "Lignes", cell: (r) => r.lines.length },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-end gap-1">
        {r.status === "draft" && (
          <ConfirmDialog trigger={<Button variant="success" size="icon-sm"><CheckCircle2 className="h-4 w-4" /></Button>} title="Confirmer ce transfert ?" description="Les mouvements de stock seront écrits." confirmLabel="Confirmer" variant="success" onConfirm={() => confirmDocument("stock_transfers", r.id)} />
        )}
        {r.status === "confirmed" && (
          <ConfirmDialog trigger={<Button variant="ghost" size="icon-sm" className="text-destructive"><XCircle className="h-4 w-4" /></Button>} title="Annuler ce transfert ?" description="Les mouvements seront contre-passés." confirmLabel="Annuler" onConfirm={() => cancelDocument("stock_transfers", r.id)} />
        )}
      </div>
    ) },
  ], []);

  return <AdminTable columns={columns} rows={rows} searchKeys={["status"]} searchPlaceholder="Rechercher..." title="Transferts de stock" countLabel={`${rows.length} transfert(s)`} newHref="/admin/stock-transfers/new" />;
}

// Stock Adjustments Table
export interface StockAdjustmentRow {
  id: string;
  date: Date;
  stock: { name: string } | null;
  reason: string | null;
  lines: { id: string }[];
  status: string;
}

export function StockAdjustmentsTable({ rows }: { rows: StockAdjustmentRow[] }) {
  const columns: Column<StockAdjustmentRow>[] = React.useMemo(() => [
    { key: "date", header: "Date", sortable: true, sortValue: (r) => r.date.getTime(), cell: (r) => formatDate(r.date) },
    { key: "stock", header: "Stock", cell: (r) => r.stock?.name ?? "—" },
    { key: "reason", header: "Motif", cell: (r) => r.reason ?? "—" },
    { key: "lines", header: "Lignes", cell: (r) => r.lines.length },
    { key: "status", header: "Statut", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "", className: "text-center", width: "48px", cell: (r) => (
      <div className="flex justify-end gap-1">
        {r.status === "draft" && (
          <ConfirmDialog trigger={<Button variant="success" size="icon-sm"><CheckCircle2 className="h-4 w-4" /></Button>} title="Confirmer cet ajustement ?" description="Les mouvements de stock seront écrits." confirmLabel="Confirmer" variant="success" onConfirm={() => confirmDocument("stock_adjustments", r.id)} />
        )}
        {r.status === "confirmed" && (
          <ConfirmDialog trigger={<Button variant="ghost" size="icon-sm" className="text-destructive"><XCircle className="h-4 w-4" /></Button>} title="Annuler cet ajustement ?" description="Les mouvements seront contre-passés." confirmLabel="Annuler" onConfirm={() => cancelDocument("stock_adjustments", r.id)} />
        )}
      </div>
    ) },
  ], []);

  return <AdminTable columns={columns} rows={rows} searchKeys={["reason"]} searchPlaceholder="Rechercher..." title="Ajustements de stock" countLabel={`${rows.length} ajustement(s)`} newHref="/admin/stock-adjustments/new" />;
}