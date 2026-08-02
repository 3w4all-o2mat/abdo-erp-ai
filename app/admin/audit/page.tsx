export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { AuditTable } from "@/components/admin/admin-table";

export default async function AuditPage() {
  await requirePermission("audit.view");
  const logs = await prisma.activityLog.findMany({ orderBy: { date: "desc" }, take: 500, include: { user: true } });

  return (
    <div className="space-y-6">
      <AuditTable rows={logs} />
    </div>
  );
}
