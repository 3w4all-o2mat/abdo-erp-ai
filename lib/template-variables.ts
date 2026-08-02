/**
 * Central registry of "system variables" that admins can insert inside the
 * `template.header` / `template.footer` HTML strings (see
 * `app/admin/templates`). Variables are referenced with the Mustache-style
 * placeholder syntax `{{key}}` and resolved at preview / print time against
 * the current `company.*` and `site.*` settings.
 *
 * Keeping the list in one place means:
 *   - the picker dialog and the resolver cannot drift apart,
 *   - new variables are a single-line addition,
 *   - the same `resolveTemplateVariables` helper is reused on both the
 *     templates page (live preview) and the document print / preview flow
 *     so the placeholders never leak as literal text into a printed PDF.
 */

export type TemplateVariableCategory = "company" | "site";

export type TemplateVariable = {
  /** Setting key, e.g. `company.name`. Used as the placeholder token. */
  key: string;
  /** French label shown in the picker dialog. */
  label: string;
  /** Group label for the dialog and for the resolver. */
  category: TemplateVariableCategory;
};

export const TEMPLATE_VARIABLES: ReadonlyArray<TemplateVariable> = [
  // Entreprise
  { key: "company.name", label: "Nom de l'entreprise", category: "company" },
  { key: "company.address", label: "Adresse", category: "company" },
  { key: "company.phone", label: "Téléphone", category: "company" },
  { key: "company.email", label: "Email", category: "company" },
  { key: "company.tax_id", label: "NIF / RC", category: "company" },
  { key: "company.currency", label: "Devise", category: "company" },
  { key: "company.vat_rate", label: "TVA par défaut (%)", category: "company" },
  // Site public
  { key: "site.title", label: "Titre du site", category: "site" },
  { key: "site.tagline", label: "Slogan", category: "site" },
];

/** A flat `Record<key, value>` map of settings, e.g. `{ "company.name": "..." }`. */
export type TemplateVariableValues = Record<string, string | undefined | null>;

/**
 * Returns the placeholder token for a variable, e.g. `{{company.name}}`.
 * Used by the picker dialog to copy into the textarea.
 */
export function placeholderFor(key: string): string {
  return `{{${key}}}`;
}

/**
 * Groups variables by category for the picker dialog rendering.
 */
export function groupVariablesByCategory(
  variables: ReadonlyArray<TemplateVariable> = TEMPLATE_VARIABLES,
): Array<{ category: TemplateVariableCategory; label: string; items: TemplateVariable[] }> {
  const order: TemplateVariableCategory[] = ["company", "site"];
  const labels: Record<TemplateVariableCategory, string> = {
    company: "Entreprise",
    site: "Site public",
  };
  return order.map((category) => ({
    category,
    label: labels[category],
    items: variables.filter((v) => v.category === category),
  }));
}

/**
 * HTML-escape a string so it is safe to inject as text into an HTML context.
 * We intentionally do NOT escape the surrounding `value` when the caller has
 * already proven it is a safe fragment (the templates themselves are admin
 * authored HTML). The resolver only escapes *substituted* values.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Replace every `{{key}}` placeholder in `input` with the matching value from
 * `values`. Unknown keys resolve to an empty string so the preview never
 * shows raw tokens. Values are HTML-escaped before substitution so a
 * placeholder like `{{company.name}}` is safe to use inside HTML.
 *
 * After substitution, every literal newline (`\n`) in the resulting string
 * is converted to a `<br/>`. Templates are authored as plain text inside a
 * `<Textarea>` so authors naturally hit Enter to start a new line — the
 * preview and the printed output should honor those line breaks instead of
 * collapsing them into a single HTML line.
 *
 * The regex is intentionally permissive on the key characters
 * (`[a-zA-Z0-9_.]+`) to match the dotted path shape of our setting keys.
 */
export function resolveTemplateVariables(
  input: string | null | undefined,
  values: TemplateVariableValues,
): string {
  if (!input) return "";
  const resolved = input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, key: string) => {
    const raw = values[key];
    if (raw === undefined || raw === null || raw === "") return "";
    return escapeHtml(raw);
  });
  return resolved.replace(/\r?\n/g, "<br/>");
}
