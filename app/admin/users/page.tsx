export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/admin/user-form";
import { UsersTable } from "@/components/admin/admin-table";
import { Plus } from "lucide-react";

export default async function UsersPage() {
  await requirePermission("users.view");
  const [users, roles, stocks] = await Promise.all([
    prisma.user.findMany({ orderBy: { fullName: "asc" }, include: { roles: { include: { role: true } }, stockUsers: true } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.stock.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description={`${users.length} utilisateur(s)`}>
        <UserFormDialog roles={roles} stocks={stocks} trigger={<Button><Plus className="h-4 w-4" /> Nouvel utilisateur</Button>} />
      </PageHeader>
      <UsersTable rows={users} roles={roles} stocks={stocks} />
    </div>
  );
}
