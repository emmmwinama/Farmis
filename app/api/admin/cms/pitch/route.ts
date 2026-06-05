import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sections = await prisma.pitchSection.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json(sections);
}

export async function PATCH(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { key, title, content, isActive } = body;

    const section = await prisma.pitchSection.upsert({
        where:  { key },
        update: { title, content, isActive: isActive ?? true },
        create: { key, title, content, isActive: isActive ?? true },
    });

    return NextResponse.json(section);
}