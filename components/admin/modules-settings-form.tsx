"use client";
import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, Hash, Eye, Pencil } from "lucide-react";
import { updateModuleSetting, updateModuleNaming, updateModuleCounter } from "@/lib/actions/content";
import { NAMING_TOKENS, generateReference, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export type ModuleSettingDef = {
  key: string;
  label: string;
  type: "boolean" | "text" | "number" | "select";
  helpText?: string;
  /** Required when `type === "select"`. */
  options?: { value: string; label: string }[];
};

export type ModuleSectionDef = {
  id: string; // category id (e.g. "quotations", "orders", "invoices")
  title: string;
  description?: string;
  settings: ModuleSettingDef[];
  /** When present, render the "Modèle de numérotation" editor for this section. */
  naming?: {
    value: string;
    nextNumber: number;
  };
};

type SettingRow = { key: string; value: string; category: string };

export function ModulesSettingsForm({
  sections,
  initialSettings,
}: {
  sections: ModuleSectionDef[];
  initialSettings: SettingRow[];
}) {
  // Group settings by their category
  const grouped = React.useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    for (const s of initialSettings) {
      if (!map.has(s.category)) map.set(s.category, {});
      map.get(s.category)![s.key] = s.value ?? "";
    }
    return map;
  }, [initialSettings]);

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <ModuleSectionCard
          key={section.id}
          section={section}
          initialValues={grouped.get(section.id) ?? {}}
        />
      ))}
    </div>
  );
}

function ModuleSectionCard({
  section,
  initialValues,
}: {
  section: ModuleSectionDef;
  initialValues: Record<string, string>;
}) {
  const [values, setValues] = React.useState<Record<string, string>>(initialValues);
  const [savedBaseline, setSavedBaseline] = React.useState<Record<string, string>>(initialValues);
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);
  const [savedKey, setSavedKey] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const isDirty = (key: string) => values[key] !== savedBaseline[key];

  async function persist(key: string, rawValue: string) {
    setLoadingKey(key);
    try {
      const def = section.settings.find((d) => d.key === key);
      if (!def) return;
      // Normalize value based on type
      let valueToStore = rawValue;
      if (def.type === "boolean") valueToStore = rawValue === "true" ? "true" : "false";
      await updateModuleSetting(key, valueToStore, section.id);
      setSavedBaseline((b) => ({ ...b, [key]: valueToStore }));
      setSavedKey(key);
      window.setTimeout(() => setSavedKey(null), 2000);
    } finally {
      setLoadingKey(null);
    }
  }

  const headerId = `${section.id}-header`;
  const bodyId = `${section.id}-body`;

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 text-left rounded-sm -m-1 p-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex-1 min-w-0">
            <CardTitle>{section.title}</CardTitle>
            {section.description && <CardDescription>{section.description}</CardDescription>}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </CardHeader>
      <div
        id={bodyId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <CardContent className="space-y-3 divide-y divide-border">
            {section.naming && (
              <NamingEditor
                slug={section.id}
                initial={section.naming.value}
                nextNumber={section.naming.nextNumber}
              />
            )}
            {section.settings.map((def) => {
              const current = values[def.key] ?? (def.type === "boolean" ? "false" : "");
              return (
                <div
                  key={def.key}
                  className="flex items-start justify-between gap-4 pt-3 first:pt-0"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={def.key} className="cursor-pointer">
                      {def.label}
                    </Label>
                    {def.helpText && (
                      <p className="text-xs text-muted-foreground">{def.helpText}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {savedKey === def.key && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Enregistré
                      </span>
                    )}
                    {def.type === "boolean" ? (
                      <Switch
                        id={def.key}
                        checked={current === "true"}
                        disabled={loadingKey === def.key}
                        onCheckedChange={async (checked) => {
                          const next = checked ? "true" : "false";
                          setValues((v) => ({ ...v, [def.key]: next }));
                          await persist(def.key, next);
                        }}
                      />
                    ) : def.type === "number" ? (
                      <input
                        id={def.key}
                        type="number"
                        value={current}
                        disabled={loadingKey === def.key}
                        onChange={(e) => setValues((v) => ({ ...v, [def.key]: e.target.value }))}
                        onBlur={() => {
                          if (isDirty(def.key)) persist(def.key, current);
                        }}
                        className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    ) : def.type === "select" && def.options ? (
                      <Select
                        value={current}
                        disabled={loadingKey === def.key}
                        onValueChange={async (next) => {
                          setValues((v) => ({ ...v, [def.key]: next }));
                          await persist(def.key, next);
                        }}
                      >
                        <SelectTrigger id={def.key} className="h-9 w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {def.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        id={def.key}
                        type="text"
                        value={current}
                        disabled={loadingKey === def.key}
                        onChange={(e) => setValues((v) => ({ ...v, [def.key]: e.target.value }))}
                        onBlur={() => {
                          if (isDirty(def.key)) persist(def.key, current);
                        }}
                        className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function NamingEditor({
  slug,
  initial,
  nextNumber,
}: {
  slug: string;
  initial: string;
  nextNumber: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(initial);
  const [baseline, setBaseline] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [counterDraft, setCounterDraft] = React.useState(String(nextNumber));
  const [counterBaseline, setCounterBaseline] = React.useState(String(nextNumber));
  const [counterSaving, setCounterSaving] = React.useState(false);
  const [counterSaved, setCounterSaved] = React.useState(false);
  const [counterError, setCounterError] = React.useState<string | null>(null);

  const dirty = value !== baseline;
  const counterDirty = counterDraft !== counterBaseline;
  const anyDirty = dirty || counterDirty;

  const preview = React.useMemo(() => {
    try {
      return generateReference(value || "", Number(counterDraft) || nextNumber);
    } catch {
      return value;
    }
  }, [value, counterDraft, nextNumber]);

  const buttonPreview = React.useMemo(() => {
    try {
      return generateReference(initial || "", nextNumber);
    } catch {
      return initial;
    }
  }, [initial, nextNumber]);

  // Reset drafts when the modal (re)opens so the user sees the current saved
  // values rather than any in-flight edits from a previous session.
  React.useEffect(() => {
    if (open) {
      setValue(initial);
      setBaseline(initial);
      setCounterDraft(String(nextNumber));
      setCounterBaseline(String(nextNumber));
      setError(null);
      setCounterError(null);
      setSaved(false);
      setCounterSaved(false);
    }
  }, [open, initial, nextNumber]);

  function insertAtCursor(token: string) {
    const el = inputRef.current;
    if (!el) {
      setValue((v) => v + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function save() {
    if (!anyDirty || saving) return;
    setSaving(true);
    setError(null);
    setCounterError(null);

    // Validate the counter first if the admin changed it; never persist
    // the pattern if the counter value is invalid.
    let parsedCounter: number | null = null;
    if (counterDirty) {
      const n = Number(counterDraft);
      if (!Number.isInteger(n) || n < 1) {
        setCounterError("Le prochain numéro doit être un entier supérieur ou égal à 1.");
        setSaving(false);
        return;
      }
      parsedCounter = n;
    }

    try {
      // Run sequentially: pattern first, then counter. The server actions
      // are independent (each writes its own column on `Module`) so the
      // order is purely a UX choice — pattern first because it's the
      // primary field.
      if (dirty) {
        await updateModuleNaming(slug, value);
        setBaseline(value);
      }
      if (parsedCounter !== null) {
        await updateModuleCounter(slug, parsedCounter);
        setCounterBaseline(String(parsedCounter));
      }
      setSaved(true);
      // Close the modal on success so the user gets immediate feedback that
      // the changes landed. Failures keep the dialog open and surface the
      // error inline so the admin can fix and retry.
      setOpen(false);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-3 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium inline-flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            Modèle de numérotation
          </p>
          <p className="text-xs text-muted-foreground">
            Aperçu et configuration de la référence des nouveaux documents. Les documents existants ne sont pas renommés.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          Aperçu de la numérotation
          <span className="font-mono text-xs text-muted-foreground">·</span>
          <span className="font-mono text-xs text-foreground">{buttonPreview || "—"}</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Modèle de numérotation
            </DialogTitle>
            <DialogDescription>
              Configurez le modèle de référence et le compteur. Les documents existants ne sont pas renommés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Pattern editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`${slug}-naming`}>Modèle</Label>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Enregistré
                  </span>
                )}
              </div>
              <input
                ref={inputRef}
                id={`${slug}-naming`}
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                spellCheck={false}
                autoComplete="off"
                placeholder="DEV/{year}/{seq}"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-1.5">
                {NAMING_TOKENS.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    title={t.label}
                    onClick={() => insertAtCursor(t.token)}
                    className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {t.token}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            {/* Live preview */}
            <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="text-muted-foreground">
                Aperçu : <span className="font-mono text-foreground text-sm">{preview || "—"}</span>
              </div>
              <div className="text-muted-foreground">
                Prochain numéro :{" "}
                <span className="font-mono text-foreground">
                  {String(Number(counterDraft) || nextNumber).padStart(5, "0")}
                </span>
              </div>
            </div>

            {/* Counter editor */}
            <div className="space-y-1.5 border-t pt-4">
              <div className="flex items-center gap-3">
                <Label htmlFor={`${slug}-counter`} className="shrink-0">
                  Prochain numéro
                </Label>
                <input
                  id={`${slug}-counter`}
                  type="number"
                  min={1}
                  value={counterDraft}
                  onChange={(e) => {
                    setCounterDraft(e.target.value);
                    setCounterSaved(false);
                    setCounterError(null);
                  }}
                  className="ml-auto h-9 w-1/2 min-w-[7rem] max-w-[10rem] rounded-md border border-input bg-background px-3 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {counterSaved && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Enregistré
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Utile pour redémarrer la numérotation à 100, 1000, etc.
              </p>
              {counterError && <p className="text-xs text-destructive">{counterError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <button
                type="button"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Fermer
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!anyDirty || saving}
              className="inline-flex items-center gap-1.5 h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" />
              {saving ? "Enregistrement…" : "Enregistrer le modèle"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
