import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  name?: string | null;
  username: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
  defaultStockId?: string;
  stocks: string[];
};

/** Get the current authenticated user (server-side). Returns null if not logged in. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/** Require an authenticated user, otherwise redirect to /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=" + encodeURIComponent("/admin"));
  return user;
}

/** Alias for `requireUser` — kept for pages that expect the older name. */
export const requireAuth = requireUser;

/** Check if a user has a given permission slug. */
export function can(user: SessionUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.roles.includes("Admin")) return true; // Admin = super role
  return user.permissions.includes(permission);
}

/** Require a permission, otherwise redirect to /admin (forbidden). */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/admin/forbidden");
  return user;
}

/** Filter a list of stock ids to those the user can access. If user has no restriction, returns all. */
export function accessibleStocks(user: SessionUser, allStockIds: string[]): string[] {
  if (user.roles.includes("Admin")) return allStockIds;
  if (!user.stocks || user.stocks.length === 0) return allStockIds;
  return allStockIds.filter((id) => user.stocks.includes(id));
}