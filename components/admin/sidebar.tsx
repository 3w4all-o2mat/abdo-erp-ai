"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRAND_ICON } from "@/lib/navigation";
import type { NavSection, NavItem } from "@/lib/navigation";
import { NavIcon } from "@/components/admin/nav-icon";

export function SidebarItem({
  item,
  collapsed,
  pathname,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  depth?: number;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(() => {
    if (!item.children) return false;
    return item.children.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
    );
  });

  const hasChildren = item.children && item.children.length > 0;
  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={cn("sidebar-link relative", active && "active", "justify-center px-0")}
      >
        <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div>
      {hasChildren ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={cn(
            "sidebar-link relative w-full",
            active && "active"
          )}
        >
          <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <NavIcon
            name={expanded ? "ChevronDown" : "ChevronRight"}
            className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60"
          />
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "sidebar-link relative",
            active && depth === 0 && "active",
            active && depth > 0 && "bg-sidebar-accent/50 text-sidebar-foreground",
            depth > 0 && "pl-10"
          )}
        >
          <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      )}
      {hasChildren && expanded && (
        <div className="space-y-0.5 mt-0.5">
          {item.children!.map((child) => (
            <SidebarItem
              key={child.href}
              item={child}
              collapsed={collapsed}
              pathname={pathname}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ sections, collapsed }: { sections: NavSection[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "hidden lg:flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "gap-2.5 px-5")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-white shadow shrink-0">
          <NavIcon name={BRAND_ICON} className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <p className="font-bold text-sidebar-foreground">Mini ERP</p>
            <p className="text-[11px] text-sidebar-foreground/60">Espace de gestion</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border text-[11px] text-sidebar-foreground/50", collapsed ? "py-3 text-center" : "p-4")}>
        {collapsed ? "v0.1" : "Mini ERP · v0.1.0"}
      </div>
    </aside>
  );
}