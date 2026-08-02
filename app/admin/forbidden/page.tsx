export const dynamic = "force-dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold">Accès refusé</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Vous n'avez pas la permission d'accéder à cette page. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
