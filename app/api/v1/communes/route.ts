import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const wilayaId = req.nextUrl.searchParams.get("wilayaId");
  if (!wilayaId) return NextResponse.json({ data: [] });
  const communes = await prisma.commune.findMany({
    where: { wilayaId: Number(wilayaId) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: communes });
}