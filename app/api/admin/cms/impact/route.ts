import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await prisma.impactStat.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(stats);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const stat = await prisma.impactStat.create({ data: body });
    return NextResponse.json(stat, { status: 201 });
}