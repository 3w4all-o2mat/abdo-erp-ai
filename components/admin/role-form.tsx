"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRole, updateRole } from "@/lib/actions/roles";
import type { Role, Module, Permission } from "@prisma/client";

export function RoleFormDialog({
  trigger, role, modules, permissions,
}: {
  trigger?: React.ReactNode;
  role?: { id?: string; name?: string; description?: string | null; permissions?: { permissionId: string }[] };
  modules: { id: string; name: string }[];
  permissions: { id: string; slug?: string; name: string; moduleId: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(role?.permissions?.map((p) => p.permissionId) ?? []);

  function toggle(id: string) { setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function toggleModule(moduleId: string, on: boolean) {
    const modulePerms = permissions.filter((p) => p.moduleId === moduleId).map((p) => p.id);
    setSelected((p) => on ? Array.from(new Set([...p, ...modulePerms])) : p.filter((x) => !modulePerms.includes(x)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name")), description: String(fd.get("description") || ""), permissionIds: selected };
    try {
      if (role?.id) await updateRole(role.id, data);
      else await createRole(data);
      setOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{role ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
          <DialogDescription>Assignez les permissions à ce rôle.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">Nom *</Label><Input id="name" name="name" defaultValue={role?.name} required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" defaultValue={role?.description ?? ""} /></div>
          </div>
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin rounded-xl border p-3">
              {modules.map((m) => {
                const perms = permissions.filter((p) => p.moduleId === m.id);
                if (perms.length === 0) return null;
                const allSelected = perms.every((p) => selected.includes(p.id));
                return (
                  <div key={m.id} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{m.name}</p>
                      <button type="button" onClick={() => toggleModule(m.id, !allSelected)} className="text-xs text-primary hover:underline">
                        {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((p) => (
                        <button type="button" key={p.id} onClick={() => toggle(p.id)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${selected.includes(p.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}