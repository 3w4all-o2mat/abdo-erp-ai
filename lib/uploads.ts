import { promises as fs } from "node:fs";
import path from "node:path";

/** Public URL prefix for product images. Files are served from /public. */
export const PRODUCT_IMAGE_PREFIX = "/uploads/products/";

/** Absolute path to the product image upload directory. */
export const PRODUCT_IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "products");

/** Allowed MIME types for product images. */
export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Max file size in bytes (5 MB). Matches `next.config.mjs` bodySizeLimit. */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Map a MIME type to a safe file extension. */
export function extForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "bin";
  }
}

/** Validate a file. Returns an error message or null if valid. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return "Format non supporté. Formats acceptés : JPEG, PNG, WebP, GIF.";
  }
  if (file.size <= 0) return "Le fichier est vide.";
  if (file.size > MAX_IMAGE_SIZE) {
    return `Fichier trop volumineux (max ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)} Mo).`;
  }
  return null;
}

/** Generate a unique filename. Uses crypto.randomUUID() to avoid collisions
 *  and a small random suffix for extra safety against enumeration. */
export function newImageFilename(mime: string): string {
  const uuid = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
    .replace(/-/g, "");
  return `${Date.now()}-${uuid}.${extForMime(mime)}`;
}

/** Safely resolve a public URL to an absolute filesystem path inside the
 *  product upload directory. Returns null if the URL is not a local upload
 *  or escapes the directory (defense against path traversal). */
export function resolveUploadPath(publicUrl: string): string | null {
  if (!publicUrl || typeof publicUrl !== "string") return null;
  if (!publicUrl.startsWith(PRODUCT_IMAGE_PREFIX)) return null;
  const relative = publicUrl.slice(PRODUCT_IMAGE_PREFIX.length);
  // Disallow parent directory references and absolute paths.
  if (relative.includes("..") || relative.startsWith("/") || relative.includes("\\")) {
    return null;
  }
  const base = path.resolve(PRODUCT_IMAGE_DIR);
  const resolved = path.resolve(base, relative);
  // Final safety check: must stay inside the upload directory.
  if (!resolved.startsWith(base + path.sep) && resolved !== base) return null;
  return resolved;
}

/** Delete a previously uploaded file. No-op if the URL is not a local
 *  upload or the file no longer exists. Never throws. */
export async function deleteUploadFile(publicUrl: string | null | undefined): Promise<void> {
  try {
    const target = resolveUploadPath(publicUrl ?? "");
    if (!target) return;
    await fs.unlink(target);
  } catch {
    // Ignore ENOENT and any other error — cleanup is best-effort.
  }
}
