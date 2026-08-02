import Link from "next/link";
import { Building2, Menu } from "lucide-react";
import { PUBLIC_NAV } from "@/lib/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export async function PublicNavbar({ siteTitle }: { siteTitle: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-white shadow">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">{siteTitle}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/login">Espace gestion</Link></Button>
        </div>
      </div>
    </header>
  );
}