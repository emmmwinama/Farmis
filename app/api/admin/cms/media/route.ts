import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const media = await prisma.cmsMedia.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json(media);
}

export async function PATCH(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { key, url, type } = await req.json();
    const media = await prisma.cmsMedia.upsert({
        where: { key },
        update: { url, type },
        create: { key, url, type, label: key },
    });
    return NextResponse.json(media);
}