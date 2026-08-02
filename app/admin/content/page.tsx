export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { ContentEditor } from "@/components/admin/content-form";

export default async function ContentPage() {
  await requirePermission("content.view");
  const blocks = await prisma.contentBlock.findMany({ orderBy: { slug: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Contenu public" description="Modifiez le contenu affiché sur le site public." />
      <div className="grid gap-4 lg:grid-cols-2">
        {blocks.map((b) => <ContentEditor key={b.id} block={b} />)}
      </div>
    </div>
  );
}
