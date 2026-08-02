import { prisma } from "@/lib/prisma";

/** Write an audit log entry. */
export async function logActivity(params: {
  userId: string;
  action: string; // created | updated | deleted | confirmed | canceled | login ...
  entity: string; // table name, e.g. "invoices"
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: (params.metadata ?? undefined) as never,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}