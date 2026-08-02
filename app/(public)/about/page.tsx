import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Users } from "lucide-react";

export default async function AboutPage() {
  const block = await prisma.contentBlock.findUnique({ where: { slug: "about" } });
  return (
    <div className="container py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight">{block?.title ?? "À propos"}</h1>
        <p className="mt-6 text-lg text-muted-foreground whitespace-pre-line">{block?.body}</p>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Target, title: "Notre mission", desc: "Offrir des produits et services de qualité à nos clients." },
          { icon: Eye, title: "Notre vision", desc: "Être le partenaire de confiance des professionnels." },
          { icon: Heart, title: "Nos valeurs", desc: "Intégrité, qualité et proximité avec nos clients." },
          { icon: Users, title: "Notre équipe", desc: "Des professionnels dévoués à votre service." },
        ].map((v) => (
          <Card key={v.title} className="card-hover">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><v.icon className="h-6 w-6" /></div>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}