import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

// Augment NextAuth types (must be at module scope)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      roles: string[];
      permissions: string[];
      defaultStockId?: string;
      stocks: string[];
    } & DefaultSession["user"];
  }
  interface User {
    username: string;
    roles: string[];
    permissions: string[];
    defaultStockId?: string;
    stocks: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            defaultStock: true,
            stockUsers: { include: { stock: true } },
          },
        });

        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        const permissions = new Set<string>();
        const roles: string[] = [];
        for (const ur of user.roles) {
          roles.push(ur.role.name);
          for (const rp of ur.role.permissions) {
            permissions.add(rp.permission.slug);
          }
        }
        const stocks = user.stockUsers.map((su) => su.stockId);

        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          email: user.email ?? undefined,
          roles,
          permissions: Array.from(permissions),
          defaultStockId: user.defaultStockId ?? undefined,
          stocks,
        } as unknown as import("next-auth").User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          username: string;
          roles: string[];
          permissions: string[];
          defaultStockId?: string;
          stocks: string[];
        };
        token.id = u.id;
        token.username = u.username;
        token.roles = u.roles;
        token.permissions = u.permissions;
        token.defaultStockId = u.defaultStockId;
        token.stocks = u.stocks;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as unknown as {
          id: string; username: string; roles: string[]; permissions: string[];
          defaultStockId?: string; stocks: string[];
        };
        session.user.id = t.id;
        session.user.username = t.username;
        session.user.roles = t.roles;
        session.user.permissions = t.permissions;
        session.user.defaultStockId = t.defaultStockId;
        session.user.stocks = t.stocks;
      }
      return session;
    },
    authorized: authConfig.callbacks?.authorized,
  },
});