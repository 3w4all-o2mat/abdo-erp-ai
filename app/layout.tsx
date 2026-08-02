import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { prisma } from "@/lib/prisma";

// This layout reads from the DB (site settings), so opt out of static prerendering
// for the whole tree — otherwise the build tries to reach the DB at build time.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Mini ERP", template: "%s · Mini ERP" },
  description: "Gestion d'entreprise — ERP simple et efficace",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.setting.findMany({ where: { category: "site" } });
  const siteTitle = settings.find((s) => s.key === "site.title")?.value ?? "Mini ERP";

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}