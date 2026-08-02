import Link from "next/link";
import { Building2 } from "lucide-react";
import { PUBLIC_NAV } from "@/lib/navigation";

export function PublicFooter({ siteTitle, company }: { siteTitle: string; company: { name: string; address?: string; phone?: string; email?: string } }) {
  return (
    <footer className="border-t bg-sidebar text-sidebar-foreground">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-white"><Building2 className="h-5 w-5" /></div>
            <span className="font-bold text-lg">{siteTitle}</span>
          </div>
          <p className="text-sm text-sidebar-foreground/70 max-w-sm">{company.address ?? ""}</p>
          {company.phone && <p className="text-sm text-sidebar-foreground/70 mt-1">{company.phone}</p>}
          {company.email && <p className="text-sm text-sidebar-foreground/70">{company.email}</p>}
        </div>
        <div>
          <p className="font-semibold mb-3">Navigation</p>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            {PUBLIC_NAV.map((i) => <li key={i.href}><Link href={i.href} className="hover:text-sidebar-foreground">{i.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Espace gestion</p>
          <Link href="/login" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">Connexion administrateur →</Link>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/50">
        © {new Date().getFullYear()} {company.name ?? siteTitle}. Tous droits réservés.
      </div>
    </footer>
  );
}