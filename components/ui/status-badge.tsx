import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  confirmed: { label: "Confirmé", variant: "success" },
  canceled: { label: "Annulé", variant: "destructive" },
  active: { label: "Actif", variant: "success" },
  inactive: { label: "Inactif", variant: "secondary" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}