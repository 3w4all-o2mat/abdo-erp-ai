"use server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateModuleSetting(key: string, value: string, category: string) {
  const user = await requirePermission("settings.manage");
  await prisma.setting.upsert({
    where: { key },
    update: { value, category },
    create: { key, value, category, sequence: 0 },
  });
  await logActivity({ userId: user.id, action: "updated", entity: "settings", entityId: key, metadata: { scope: "modules" } });
  revalidatePath("/admin/settings/modules");
  // Also revalidate the admin layout so toggles that affect the sidebar
  // (e.g. `invoices.show_in_sidebar`) are reflected on the next navigation
  // without requiring a hard reload.
  revalidatePath("/admin", "layout");
}

export async function updateContentBlock(slug: string, data: { title: string; body: string; image?: string }) {
  const user = await requirePermission("content.manage");
  await prisma.contentBlock.update({ where: { slug }, data: { title: data.title, body: data.body, image: data.image || null } });
  await logActivity({ userId: user.id, action: "updated", entity: "content_blocks", entityId: slug });
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/about");
}

export async function createContentBlock(data: { slug: string; title: string; body: string; image?: string }) {
  const user = await requirePermission("content.manage");
  const block = await prisma.contentBlock.create({ data: { slug: data.slug, title: data.title, body: data.body, image: data.image || null } });
  await logActivity({ userId: user.id, action: "created", entity: "content_blocks", entityId: block.id });
  revalidatePath("/admin/content");
}

export async function updateSetting(key: string, value: string) {
  const user = await requirePermission("settings.manage");
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value, category: "general" } });
  await logActivity({ userId: user.id, action: "updated", entity: "settings", entityId: key });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

/**
 * Updates one of the print template settings (`template.header` or
 * `template.footer`). The category is always forced to `template` so the
 * settings stay grouped even if they were missing from the seed.
 */
export async function updateTemplateSetting(key: "template.header" | "template.footer", value: string) {
  const user = await requirePermission("settings.manage");
  await prisma.setting.upsert({
    where: { key },
    update: { value, category: "template" },
    create: { key, value, category: "template", sequence: key === "template.header" ? 1 : 2 },
  });
  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "settings",
    entityId: key,
    metadata: { scope: "templates" },
  });
  revalidatePath("/admin/templates");
}

/**
 * Update the `namingDoc` pattern for a numbered module (quotations, orders,
 * invoices, ...). Validates the pattern on the server: must contain at least
 * one sequence token and only use known placeholders.
 */
export async function updateModuleNaming(slug: string, pattern: string) {
  const user = await requirePermission("settings.manage");

  const cleaned = (pattern ?? "").trim();
  if (!cleaned) {
    throw new Error("Le modèle de numérotation ne peut pas être vide.");
  }
  if (cleaned.length > 120) {
    throw new Error("Le modèle de numérotation est trop long (120 caractères max).");
  }
  if (!/\{(?:seq|sequence)\}/.test(cleaned)) {
    throw new Error("Le modèle doit contenir un compteur ({seq} ou {sequence}).");
  }
  const known = new Set(["{year}", "{year2}", "{month}", "{seq}", "{sequence}"]);
  for (const m of cleaned.matchAll(/\{[a-zA-Z0-9_]+\}/g)) {
    if (!known.has(m[0])) {
      throw new Error(`Jeton inconnu : ${m[0]}. Jetons autorisés : {year}, {year2}, {month}, {seq}.`);
    }
  }

  const before = await prisma.module.findUnique({ where: { slug } });
  if (!before) throw new Error(`Module introuvable : ${slug}`);

  await prisma.module.update({
    where: { slug },
    data: { namingDoc: cleaned },
  });

  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "modules",
    entityId: before.id,
    metadata: { field: "namingDoc", from: before.namingDoc, to: cleaned, slug },
  });
  revalidatePath("/admin/settings/modules");
}

/**
 * Update the `nextNumber` counter for a numbered module. Lets the admin
 * (re)start the sequence at any positive integer (e.g. 100, 1000). Existing
 * documents keep their stored `reference`; only future documents are
 * affected. The value is validated server-side and audit-logged.
 */
export async function updateModuleCounter(slug: string, nextNumber: number) {
  const user = await requirePermission("settings.manage");

  if (!Number.isInteger(nextNumber) || nextNumber < 1) {
    throw new Error("Le prochain numéro doit être un entier supérieur ou égal à 1.");
  }
  if (nextNumber > 999_999_999) {
    throw new Error("Le prochain numéro est trop grand.");
  }

  const before = await prisma.module.findUnique({ where: { slug } });
  if (!before) throw new Error(`Module introuvable : ${slug}`);

  await prisma.module.update({
    where: { slug },
    data: { nextNumber },
  });

  await logActivity({
    userId: user.id,
    action: "updated",
    entity: "modules",
    entityId: before.id,
    metadata: { field: "nextNumber", from: before.nextNumber, to: nextNumber, slug },
  });
  revalidatePath("/admin/settings/modules");
}