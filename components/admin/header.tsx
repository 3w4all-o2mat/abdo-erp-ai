"use client";
import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, ChevronDown, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";
import { initials } from "@/lib/utils";

export function Header({ onMenuClick, onToggleCollapse, sidebarCollapsed }: { onMenuClick?: () => void; onToggleCollapse?: () => void; sidebarCollapsed?: boolean }) {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; username?: string; roles?: string[] } | undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="hidden lg:flex h-8 w-8 rounded-lg border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-200"
        onClick={onToggleCollapse}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronsRight className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <ChevronsLeft className="h-4 w-4 transition-transform duration-300" />
        )}
      </Button>
      <div className="flex-1" />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-medium">{user?.name ?? "Utilisateur"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.roles?.[0] ?? ""}</p>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">@{user?.username}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/profile"><UserIcon className="h-4 w-4" /> Mon profil</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}