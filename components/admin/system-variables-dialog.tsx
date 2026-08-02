"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Variable, Plus } from "lucide-react";
import {
  groupVariablesByCategory,
  placeholderFor,
  type TemplateVariable,
  type TemplateVariableValues,
} from "@/lib/template-variables";

type Props = {
  /** Whether the dialog is open. Controlled by the parent. */
  open: boolean;
  /** Called when the dialog open state should change (close / open). */
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the admin picks a variable. The placeholder string
   * (e.g. `{{company.name}}`) is passed so the parent can splice it at
   * the current cursor position. The dialog will close automatically
   * after a selection; reopen the trigger to insert another one.
   */
  onInsert: (placeholder: string, variable: TemplateVariable) => void;
  /**
   * Current values of the variables, used to show a "Valeur actuelle"
   * hint next to each chip so the admin knows what they will get.
   */
  values?: TemplateVariableValues;
};

/**
 * Picker dialog that lists every system variable available for the print
 * templates (header / footer). The chips are grouped by category
 * (Entreprise / Site public). Each chip shows the friendly label, the
 * placeholder token, and the current value (if any) so the admin can
 * self-document what they are about to insert.
 */
export function SystemVariablesDialog({ open, onOpenChange, onInsert, values }: Props) {
  const groups = React.useMemo(() => groupVariablesByCategory(), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[61.2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Variables système
          </DialogTitle>
          <DialogDescription>
            Cliquez sur une variable pour l'insérer à la position du curseur dans le
            champ. La fenêtre se fermera automatiquement après l'insertion. La valeur
            sera remplacée par celle configurée dans les paramètres de l'entreprise
            lors de l'aperçu et de l'impression.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.category} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h4>
              <div className="flex flex-wrap gap-2">
                {group.items.map((variable) => {
                  const placeholder = placeholderFor(variable.key);
                  const current = values?.[variable.key];
                  return (
                    <button
                      key={variable.key}
                      type="button"
                      onClick={() => onInsert(placeholder, variable)}
                      className="group inline-flex flex-col items-start gap-0.5 rounded-md border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                        {variable.label}
                      </span>
                      <code className="font-mono text-[11px] text-muted-foreground">
                        {placeholder}
                      </code>
                      {current !== undefined && current !== null && current !== "" ? (
                        <span className="text-[10px] text-muted-foreground/80 italic">
                          Valeur actuelle : {current}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic">
                          Non renseigné
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
