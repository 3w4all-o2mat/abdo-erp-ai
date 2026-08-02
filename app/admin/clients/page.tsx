export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { ClientsTable } from "@/components/admin/admin-table";

export default async function ClientsPage() {
  await requirePermission("clients.view");
  const [clients, wilayas] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, include: { wilaya: true, commune: true } }),
    prisma.wilaya.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <ClientsTable rows={clients.map(c => ({ ...c, id: c.id.toString() }))} wilayas={wilayas} />
    </div>
  );
}
