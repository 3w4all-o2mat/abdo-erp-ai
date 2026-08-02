"use client";
import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Format a byte count as a short, human-readable string. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

/** Image upload widget.
 *
 *  Controlled component. Parent owns the `value` (the public URL of the
 *  image) and receives change events via `onChange`. A new file is uploaded
 *  immediately when selected; on success the new URL is reported through
 *  `onChange`. Picking a new file always replaces the previous one.
 *
 *  Pass a hidden text input named `name` to keep the value part of the
 *  surrounding form (e.g. a `<form>` submitted to a Server Action). */
export interface ImageUploadProps {
  /** Current public URL of the image, or empty string / null for none. */
  value: string | null | undefined;
  /** Called with the new URL after a successful upload, or "" to clear. */
  onChange: (url: string) => void;
  /** Name of the hidden input rendered alongside the picker. */
  name?: string;
  /** Optional label rendered above the picker. */
  label?: string;
  /** Disable the widget (e.g. while the parent form is submitting). */
  disabled?: boolean;
  /** Override the upload endpoint. Defaults to `/api/v1/uploads/products`. */
  endpoint?: string;
  /** Optional extra class names for the root container. */
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  name = "image",
  label = "Photo",
  disabled,
  endpoint = "/api/v1/uploads/products",
  className,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingName, setPendingName] = React.useState<string | null>(null);

  const hasImage = !!value;

  async function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
      return;
    }
    setUploading(true);
    setPendingName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Échec de l'envoi de l'image.");
        return;
      }
      onChange(data.url);
    } catch (e) {
      console.error("upload error", e);
      setError("Erreur réseau lors de l'envoi.");
    } finally {
      setUploading(false);
      setPendingName(null);
      // Reset the input so the same file can be re-selected if needed.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleRemove() {
    onChange("");
    setError(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex items-start gap-3">
        {/* Preview / placeholder */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/30">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value!} alt="Aperçu" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Envoi..." : hasImage ? "Remplacer" : "Choisir une image"}
            </Button>
            {hasImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={handleRemove}
              >
                <X className="h-4 w-4" /> Supprimer
              </Button>
            )}
          </div>
          {pendingName && !error && (
            <p className="text-xs text-muted-foreground truncate">{pendingName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP ou GIF. Max {MAX_SIZE_MB} Mo.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Hidden input that the surrounding <form> will submit. */}
        <input type="hidden" name={name} value={value ?? ""} />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled || uploading}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
