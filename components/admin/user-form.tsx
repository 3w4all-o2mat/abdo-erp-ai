"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser, updateUser } from "@/lib/actions/users";
import type { User, Role, Stock } from "@prisma/client";

export function UserFormDialog({
  trigger, user, roles, stocks,
}: {
  trigger?: React.ReactNode;
  user?: User & { roles: { roleId: string }[]; stockUsers: { stockId: string }[] };
  roles: Role[];
  stocks: Stock[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [defaultStockId, setDefaultStockId] = React.useState(user?.defaultStockId ?? "");
  const [roleIds, setRoleIds] = React.useState<string[]>(user?.roles.map((r) => r.roleId) ?? []);
  const [stockIds, setStockIds] = React.useState<string[]>(user?.stockUsers.map((s) => s.stockId) ?? []);

  function toggleRole(id: string) { setRoleIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function toggleStock(id: string) { setStockIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      username: String(fd.get("username")), password: String(fd.get("password") || ""),
      fullName: String(fd.get("fullName")), email: String(fd.get("email") || ""), phone: String(fd.get("phone") || ""),
      defaultStockId: defaultStockId || null, isActive: fd.get("isActive") === "on",
      roleIds, stockIds,
    };
    try {
      if (user) await updateUser(user.id, { ...data, password: data.password || undefined });
      else await createUser(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>{user ? "Mettez à jour les informations." : "Créez un compte utilisateur."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="username">Nom d'utilisateur *</Label><Input id="username" name="username" defaultValue={user?.username} required /></div>
          <div className="space-y-2"><Label htmlFor="fullName">Nom complet *</Label><Input id="fullName" name="fullName" defaultValue={user?.fullName} required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} /></div>
          <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" name="phone" defaultValue={user?.phone ?? ""} /></div>
          <div className="space-y-2"><Label htmlFor="password">{user ? "Nouveau mot de passe" : "Mot de passe *"}{user && " (vide = inchangé)"}</Label><Input id="password" name="password" type="password" required={!user} /></div>
          <div className="space-y-2">
            <Label>Stock par défaut</Label>
            <Select value={defaultStockId} onValueChange={setDefaultStockId}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>{stocks.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Rôles</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button type="button" key={r.id} onClick={() => toggleRole(r.id)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${roleIds.includes(r.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Accès aux stocks</Label>
            <div className="flex flex-wrap gap-2">
              {stocks.map((s) => (
                <button type="button" key={s.id} onClick={() => toggleStock(s.id)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${stockIds.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Aucune sélection = accès à tous les stocks.</p>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2"><Switch id="isActive" name="isActive" defaultChecked={user?.isActive ?? true} /><Label htmlFor="isActive">Compte actif</Label></div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}