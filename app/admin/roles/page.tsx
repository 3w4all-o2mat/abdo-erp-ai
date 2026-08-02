export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleFormDialog } from "@/components/admin/role-form";
import { RoleActions } from "@/components/admin/role-actions";
import { Plus, ShieldCheck } from "lucide-react";

export default async function RolesPage() {
  await requirePermission("roles.view");
  const [roles, modules, permissions] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" }, include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } } }),
    prisma.module.findMany({ orderBy: { name: "asc" } }),
    prisma.permission.findMany({ orderBy: { slug: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Rôles & Permissions" description={`${roles.length} rôle(s)`}>
        <RoleFormDialog modules={modules} permissions={permissions} trigger={<Button><Plus className="h-4 w-4" /> Nouveau rôle</Button>} />
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.id} className="card-hover">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <CardDescription className="text-xs">{r._count.users} utilisateur(s)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
              <div className="flex flex-wrap gap-1">
                {r.permissions.slice(0, 6).map((p) => <Badge key={p.permissionId} variant="secondary" className="text-[10px]">{p.permission.name}</Badge>)}
                {r.permissions.length > 6 && <Badge variant="outline" className="text-[10px]">+{r.permissions.length - 6}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{r.permissions.length} permission(s)</p>
              <RoleActions role={r} modules={modules} permissions={permissions} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
