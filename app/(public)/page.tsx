import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { getCompanyCurrency } from "@/lib/settings";
import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Truck, Headphones } from "lucide-react";

export default async function HomePage() {
  const [blocks, products, settings, currency] = await Promise.all([
    prisma.contentBlock.findMany(),
    prisma.product.findMany({ where: { isActive: true }, include: { currentPrice: true, category: true }, take: 8, orderBy: { name: "asc" } }),
    prisma.setting.findMany(),
    getCompanyCurrency(),
  ]);
  const get = (slug: string) => blocks.find((b) => b.slug === slug);
  const heroTitle = get("hero_title")?.body ?? "Bienvenue";
  const heroSubtitle = get("hero_subtitle")?.body ?? "";
  const services = get("services")?.body ?? "";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="container relative py-20 lg:py-28 text-center">
          <Badge variant="secondary" className="mb-4">{settings.find((s) => s.key === "company.name")?.value ?? "Entreprise"}</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto">{heroTitle}</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">{heroSubtitle}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg"><Link href="/products">Découvrir nos produits <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/contact">Nous contacter</Link></Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, title: "Produits de qualité", desc: "Une sélection rigoureuse pour répondre à vos besoins." },
            { icon: ShieldCheck, title: "Confiance & fiabilité", desc: "Des années d'expérience à votre service." },
            { icon: Truck, title: "Livraison rapide", desc: "Partout en Algérie dans les meilleurs délais." },
            { icon: Headphones, title: "Support dédié", desc: "Une équipe à votre écoute pour vous accompagner." },
          ].map((f) => (
            <Card key={f.title} className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-6 w-6" /></div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Products preview */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Nos produits</h2>
            <p className="text-muted-foreground mt-1">Découvrez notre sélection</p>
          </div>
          <Button asChild variant="outline"><Link href="/products">Voir tout <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id} className="card-hover overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
                <Package className="h-12 w-12 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">{p.category?.name ?? "Général"}</Badge>
                <p className="font-medium truncate">{p.displayName ?? p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                <p className="mt-2 font-bold text-primary">{formatMoney(p.currentPrice?.unitPrice.toNumber() ?? 0, currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Services / CTA */}
      {services && (
        <section className="bg-sidebar text-sidebar-foreground">
          <div className="container py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{get("services")?.title ?? "Nos services"}</h2>
            <p className="mt-4 text-sidebar-foreground/70 max-w-2xl mx-auto whitespace-pre-line">{services}</p>
            <Button asChild size="lg" className="mt-8"><Link href="/contact">Demander un devis <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </section>
      )}
    </div>
  );
}