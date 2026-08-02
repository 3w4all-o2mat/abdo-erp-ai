export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building2, Calendar, User as UserIcon, Shield } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return <p>Non autorisé</p>;

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
      defaultStock: true,
    },
  });

  if (!user) return <p>Utilisateur introuvable</p>;

  const roleNames = user.roles.map((r) => r.role.name);

  return (
    <div className="space-y-6">
      <PageHeader title="Mon Profil" description="Informations de votre compte">
        <Button asChild variant="outline"><Link href="/admin"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-2xl">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.fullName}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <Badge variant={user.isActive ? "default" : "secondary"} className="mt-1">
                  {user.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{user.email || "Non défini"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Téléphone:</span>
                <span>{user.phone || "Non défini"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Stock par défaut:</span>
                <span>{user.defaultStock?.name || "Non défini"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles & Access Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rôles & Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Rôles assignés</h4>
              <div className="flex flex-wrap gap-2">
                {roleNames.length > 0 ? (
                  roleNames.map((role) => (
                    <Badge key={role} variant="outline" className="px-3 py-1">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun rôle assigné</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Activité</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Inscrit le:</span>
                  <span>{user.createdAt.toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dernière connexion:</span>
                  <span>{user.lastLogin?.toLocaleDateString("fr-FR") || "Jamais"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/admin/users/${user.id}`}>
            Modifier mon profil
          </Link>
        </Button>
      </div>
    </div>
  );
}
