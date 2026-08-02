import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Lightweight config used by middleware (Edge runtime — no bcrypt/prisma).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      // The actual authorize logic lives in lib/auth.ts (Node runtime).
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path === "/" || path.startsWith("/login") || path.startsWith("/api/auth")) return true;
      if (path.startsWith("/admin")) return !!auth?.user;
      return true;
    },
  },
};