"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateTemplateSetting } from "@/lib/actions/content";
import { SystemVariablesDialog } from "@/components/admin/system-variables-dialog";
import {
  resolveTemplateVariables,
  type TemplateVariable,
  type TemplateVariableValues,
} from "@/lib/template-variables";
import { Save, Check, RotateCcw, Variable } from "lucide-react";

type TemplateKey = "template.header" | "template.footer";

type Props = {
  initialHeader: string;
  initialFooter: string;
  /** Current `company.*` / `site.*` values used for preview resolution and
   *  as "Valeur actuelle" hints in the picker dialog. */
  variables: TemplateVariableValues;
};

export function TemplatesForm({ initialHeader, initialFooter, variables }: Props) {
  return (
    <div className="space-y-4">
      <TemplateField
        keyName="template.header"
        title="En-tête d'impression"
        description="Affiché en haut des documents imprimés (devis, commandes, factures, ...). Vous pouvez utiliser du texte brut ou du HTML basique."
        rows={8}
        initialValue={initialHeader}
        placeholder='Ex. : <div style="text-align:center"><strong>Mon Entreprise</strong><br/>Alger, Algérie</div>'
        variables={variables}
      />
      <TemplateField
        keyName="template.footer"
        title="Pied de page d'impression"
        description="Affiché en bas des documents imprimés. Idéal pour les mentions légales, conditions de paiement ou coordonnées."
        rows={5}
        initialValue={initialFooter}
        placeholder="Ex. : SIRET 000 000 000 — Conditions de paiement : 30 jours"
        variables={variables}
      />
    </div>
  );
}

function TemplateField({
  keyName,
  title,
  description,
  rows,
  initialValue,
  placeholder,
  variables,
}: {
  keyName: TemplateKey;
  title: string;
  description: string;
  rows: number;
  initialValue: string;
  placeholder: string;
  variables: TemplateVariableValues;
}) {
  const [value, setValue] = React.useState(initialValue);
  const [baseline, setBaseline] = React.useState(initialValue);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  // Preview is always visible now that variable resolution is part of the
  // editor UX — toggling it would just hide useful information.
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  // Remembered cursor position. We snapshot it on every selection-changing
  // event so the picker can insert at the user's last known caret position
  // even though the dialog steals focus while open.
  const selectionRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const isDirty = value !== baseline;

  function rememberSelection() {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const { start, end } = selectionRef.current;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    // Restore the caret right after the inserted text on the next paint,
    // once React has actually re-rendered the textarea with `next`.
    const caret = start + text.length;
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
      selectionRef.current = { start: caret, end: caret };
    });
  }

  async function save() {
    setLoading(true);
    try {
      await updateTemplateSetting(keyName, value);
      setBaseline(value);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setValue(baseline);
  }

  // Detect whether the current value actually contains a placeholder so we
  // can show a small hint above the preview block.
  const hasPlaceholders = /\{\{\s*[a-zA-Z0-9_.]+\s*\}\}/.test(value);
  // Pre-resolve placeholders for the live preview. The raw `value` is what
  // gets saved to the database; the preview is a render-only artifact.
  const previewHtml = React.useMemo(
    () => resolveTemplateVariables(value, variables),
    [value, variables],
  );

  function handlePickerInsert(placeholder: string, _variable: TemplateVariable) {
    insertAtCursor(placeholder);
    // Close the dialog after each selection — the admin can reopen it
    // from the button to insert another variable.
    setPickerOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
            {keyName}
          </code>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={keyName}>Contenu</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  // Snapshot the cursor before opening the dialog so the
                  // first insertion lands at the right place even if the
                  // user never clicked into the textarea.
                  rememberSelection();
                  setPickerOpen(true);
                }}
                className="h-7 gap-1.5 px-2 text-xs border-emerald-700 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-800"
              >
                <Variable className="h-3.5 w-3.5" />
                Ajouter variables system
              </Button>
            </div>
          </div>
          <Textarea
            id={keyName}
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSelect={rememberSelection}
            onKeyUp={rememberSelection}
            onClick={rememberSelection}
            onFocus={rememberSelection}
            rows={rows}
            placeholder={placeholder}
            className="font-mono text-sm"
          />
          {hasPlaceholders && (
            <p className="text-[11px] text-muted-foreground">
              Astuce : les variables <code className="font-mono">{"{{...}}"}</code> sont
              automatiquement remplacées par leur valeur actuelle dans l'aperçu et à
              l'impression.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Aperçu rendu
          </Label>
          <div
            className="min-h-[60px] rounded-md border border-dashed bg-muted/30 p-3 text-sm"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={loading || !isDirty} size="sm">
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Enregistré
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {loading ? "..." : "Enregistrer"}
              </>
            )}
          </Button>
          <Button
            onClick={reset}
            disabled={loading || !isDirty}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </Button>
          {isDirty && !saved && (
            <span className="text-xs text-orange-600">Modifications non enregistrées</span>
          )}
        </div>
      </CardContent>
      <SystemVariablesDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onInsert={handlePickerInsert}
        values={variables}
      />
    </Card>
  );
}
