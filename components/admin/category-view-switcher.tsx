"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryActions } from "@/components/admin/category-actions";

export interface CategoryViewItem {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  products: number;
  children: number;
}

type View = "block" | "list";

const ViewContext = createContext<{ view: View; setView: (v: View) => void }>({
  view: "block",
  setView: () => {},
});

export function CategoryViewProvider({
  categories,
  all,
  children,
}: {
  categories: CategoryViewItem[];
  all: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const [view, setView] = useState<View>("list");

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
      {view === "block" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.parentName ? `Sous: ${c.parentName} · ` : ""}
                    {c.products} produit(s) · {c.children} sous-cat(s)
                  </p>
                  <CategoryActions category={c} categories={all} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border divide-y mt-5 bg-background">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FolderTree className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.parentName ? `Sous: ${c.parentName} · ` : ""}
                  {c.products} produit(s) · {c.children} sous-cat(s)
                </p>
              </div>
              <CategoryActions category={c} categories={all} />
            </div>
          ))}
        </div>
      )}
    </ViewContext.Provider>
  );
}

export function CategoryViewToggle() {
  const { view, setView } = useContext(ViewContext);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === "block" ? "secondary" : "outline"}
        size="icon"
        aria-label="Vue en blocs"
        aria-pressed={view === "block"}
        onClick={() => setView("block")}
        className={cn(view === "block" && "ring-1 ring-primary/40")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "list" ? "secondary" : "outline"}
        size="icon"
        aria-label="Vue en liste"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={cn(view === "list" && "ring-1 ring-primary/40")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
