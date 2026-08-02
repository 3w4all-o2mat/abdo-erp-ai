export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { UserFormDialog } from "@/components/admin/user-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("users.update");
  const [user, roles, stocks] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { roles: true, stockUsers: true } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.stock.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!user) return <p>Utilisateur introuvable</p>;
  return (
    <div className="space-y-6">
      <PageHeader title={user.fullName} description={`@${user.username}`}>
        <Button asChild variant="outline"><Link href="/admin/users"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      </PageHeader>
      <UserFormDialog user={user} roles={roles} stocks={stocks} trigger={<Button>Modifier</Button>} />
    </div>
  );
}
