import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";

export default async function ContactPage() {
  const settings = await prisma.setting.findMany();
  const get = (k: string) => settings.find((s) => s.key === k)?.value;
  const block = await prisma.contentBlock.findUnique({ where: { slug: "contact" } });

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contactez-nous</h1>
        <p className="mt-4 text-muted-foreground">{block?.body ?? "N'hésitez pas à nous contacter pour toute demande."}</p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
        {[
          { icon: MapPin, label: "Adresse", value: get("company.address") ?? "—" },
          { icon: Phone, label: "Téléphone", value: get("company.phone") ?? "—" },
          { icon: Mail, label: "Email", value: get("company.email") ?? "—" },
        ].map((c) => (
          <Card key={c.label} className="card-hover">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-6 w-6" /></div>
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}