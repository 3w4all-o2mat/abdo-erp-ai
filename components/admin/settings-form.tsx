"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateSetting } from "@/lib/actions/content";
import { Save, Check } from "lucide-react";

type Setting = { key: string; value: string };

const BOOLEAN_KEYS = new Set(["company.vat_enabled"]);

export function SettingsForm({ settings, title, description }: { settings: Setting[]; title: string; description?: string }) {
  const initialValues = React.useMemo(
    () => Object.fromEntries(settings.map((s) => [s.key, s.value ?? ""])),
    [settings],
  );
  const [values, setValues] = React.useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [savedBaseline, setSavedBaseline] = React.useState<Record<string, string>>(initialValues);

  const isDirty = (key: string) => values[key] !== savedBaseline[key];

  async function save(key: string) {
    setLoading(key);
    try {
      const newValue = values[key] ?? "";
      await updateSetting(key, newValue);
      setSavedBaseline((b) => ({ ...b, [key]: newValue }));
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally { setLoading(null); }
  }

  const labels: Record<string, string> = {
    "company.name": "Nom de l'entreprise", "company.address": "Adresse", "company.phone": "Téléphone",
    "company.email": "Email", "company.tax_id": "NIF / RC", "company.currency": "Devise",
    "company.vat_enabled": "TVA applicable", "company.vat_rate": "TVA par défaut (%)",
    "site.title": "Titre du site", "site.tagline": "Slogan",
  };

  // Hide VAT rate when VAT is disabled
  const visibleSettings = settings.filter((s) => {
    if (s.key === "company.vat_rate") return values["company.vat_enabled"] === "true";
    return true;
  });

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
      <CardContent className="space-y-4">
        {visibleSettings.map((s) => (
          <div key={s.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            {BOOLEAN_KEYS.has(s.key) ? (
              <div className="flex items-center justify-between gap-4 py-2">
                <Label htmlFor={s.key} className="cursor-pointer">{labels[s.key] ?? s.key}</Label>
                <Switch
                  id={s.key}
                  checked={values[s.key] === "true"}
                  disabled={loading === s.key}
                  onCheckedChange={async (checked) => {
                    const newValue = checked ? "true" : "false";
                    setValues((v) => ({ ...v, [s.key]: newValue }));
                    setLoading(s.key);
                    try {
                      await updateSetting(s.key, newValue);
                      setSavedBaseline((b) => ({ ...b, [s.key]: newValue }));
                      setSaved(s.key);
                      setTimeout(() => setSaved(null), 2000);
                    } finally {
                      setLoading(null);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor={s.key}>{labels[s.key] ?? s.key}</Label>
                  <Input id={s.key} value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                </div>
                <Button
                  onClick={() => save(s.key)}
                  disabled={loading === s.key}
                  size="sm"
                  variant="outline"
                  className={
                    saved === s.key
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
                      : isDirty(s.key)
                        ? "animate-shake border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-700"
                        : ""
                  }
                >
                  {saved === s.key ? <><Check className="h-4 w-4" /> OK</> : <><Save className="h-4 w-4" /> {loading === s.key ? "..." : "OK"}</>}
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}