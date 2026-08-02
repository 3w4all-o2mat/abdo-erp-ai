import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  PRODUCT_IMAGE_DIR,
  PRODUCT_IMAGE_PREFIX,
  deleteUploadFile,
  newImageFilename,
  validateImageFile,
} from "@/lib/uploads";

export const runtime = "nodejs";
// The default body size is 1 MB; bump it for image uploads. The same limit
// is configured for server actions in `next.config.mjs` so the two paths
// stay consistent.
export const dynamic = "force-dynamic";

/** POST /api/v1/uploads/products
 *  Accepts `multipart/form-data` with a `file` field. Returns the public URL. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  // Either create or update permission is sufficient to upload a product image.
  const user = session.user as unknown as { permissions: string[]; roles: string[] };
  const allowed = can(user as never, "products.create") || can(user as never, "products.update");
  if (!allowed) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const err = validateImageFile(file);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  // Ensure the directory exists, then write the file with a unique name.
  try {
    await fs.mkdir(PRODUCT_IMAGE_DIR, { recursive: true });
    const filename = newImageFilename(file.type);
    const target = path.join(PRODUCT_IMAGE_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(target, buffer);
    return NextResponse.json({ url: `${PRODUCT_IMAGE_PREFIX}${filename}` });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Échec de l'enregistrement du fichier." }, { status: 500 });
  }
}

/** DELETE /api/v1/uploads/products
 *  Body: `{ url: string }`. Removes a previously uploaded image from disk
 *  if (and only if) it lives inside our upload directory. */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = session.user as unknown as { permissions: string[]; roles: string[] };
  const allowed = can(user as never, "products.create") || can(user as never, "products.update");
  if (!allowed) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (typeof body.url !== "string") {
    return NextResponse.json({ error: "Champ `url` requis." }, { status: 400 });
  }
  await deleteUploadFile(body.url);
  return NextResponse.json({ ok: true });
}
