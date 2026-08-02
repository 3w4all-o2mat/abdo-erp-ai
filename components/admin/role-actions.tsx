"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteRecord } from "@/lib/actions";
import { Pencil, Trash2 } from "lucide-react";
import { RoleFormDialog } from "@/components/admin/role-form";

export function RoleActions({ role, modules, permissions }: { role: { id: string; name: string }, modules: { id: string; name: string }[], permissions: { id: string; slug: string; name: string; moduleId: string }[] }) {
  return (
    <div className="flex gap-1">
      <RoleFormDialog role={role as Parameters<typeof RoleFormDialog>[0]["role"]} modules={modules} permissions={permissions} trigger={<Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /> Modifier</Button>} />
      {role.name !== "Admin" && (
        <ConfirmDialog title="Supprimer ce rôle ?" onConfirm={() => deleteRecord("roles", role.id, "roles.delete")}>
          <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
