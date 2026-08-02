export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { ClientFormDialog } from "@/components/admin/client-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("clients.update");
  const client = await prisma.client.findUnique({
    where: { id },
    include: { wilaya: true, commune: true },
  });
  const wilayas = await prisma.wilaya.findMany({ orderBy: { name: "asc" } });
  if (!client) return <p>Client introuvable</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={client.name} description="Modifier le client">
        <Button asChild variant="outline"><Link href="/admin/clients"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      </PageHeader>
      <ClientFormDialog client={client} wilayas={wilayas} trigger={<Button>Modifier</Button>} />
    </div>
  );
}
