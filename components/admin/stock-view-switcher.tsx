"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Warehouse, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockActions } from "@/components/admin/stock-actions";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSettingsCurrency } from "@/components/providers/settings-provider";

export interface StockViewItem {
  id: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  qty: number;
  value: number;
  users: number;
}

type View = "block" | "list";

const ViewContext = createContext<{ view: View; setView: (v: View) => void }>({
  view: "block",
  setView: () => {},
});

export function StockViewProvider({
  stocks,
  children,
}: {
  stocks: StockViewItem[];
  children: React.ReactNode;
}) {
  const [view, setView] = useState<View>("list");
  const currency = useSettingsCurrency();

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
      {view === "block" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
          {stocks.map((s) => (
            <Card key={s.id} className="card-hover">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{s.address}
                      </p>
                    )}
                  </div>
                </div>
                {s.isDefault && <Badge variant="default">Par défaut</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Unités</p>
                    <p className="font-bold">{formatNumber(s.qty, 0)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Valeur</p>
                    <p className="font-bold">{formatMoney(s.value, currency)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.users} utilisateur(s) autorisé(s)</p>
                <div className="flex gap-1">
                  <StockActions stock={{ id: s.id, name: s.name, address: s.address, isDefault: s.isDefault }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border divide-y mt-5">
          {stocks.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Warehouse className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.address ? `${s.address} · ` : ""}
                  {formatNumber(s.qty, 0)} unités · {formatMoney(s.value, currency)}
                </p>
              </div>
              {s.isDefault && <Badge variant="default" className="shrink-0">Par défaut</Badge>}
              <p className="text-xs text-muted-foreground shrink-0">{s.users} utilisateur(s)</p>
              <StockActions stock={{ id: s.id, name: s.name, address: s.address, isDefault: s.isDefault }} />
            </div>
          ))}
        </div>
      )}
    </ViewContext.Provider>
  );
}

export function StockViewToggle() {
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
