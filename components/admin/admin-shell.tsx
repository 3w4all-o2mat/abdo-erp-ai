"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import type { NavSection } from "@/lib/navigation";
import { NavIcon } from "@/components/admin/nav-icon";
import { cn } from "@/lib/utils";

const SIDEBAR_STATE_KEY = "mini-erp-sidebar-collapsed";

export function AdminShell({ sections, children }: { sections: NavSection[]; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_STATE_KEY) === "true");
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar sections={sections} collapsed={collapsed} />
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground animate-fade-in">
            <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
              <span className="font-bold">Mini ERP</span>
            </div>
            <nav className="overflow-y-auto h-[calc(100%-4rem)] px-3 py-4 space-y-6 scrollbar-thin">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.href}
                        item={item}
                        collapsed={false}
                        pathname={pathname}
                        onNavigate={closeMobile}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} onToggleCollapse={toggleCollapsed} sidebarCollapsed={collapsed} />
        <main className={cn("flex-1 p-4 lg:p-6")}>{children}</main>
      </div>
    </div>
  );
}