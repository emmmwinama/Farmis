import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const content = await prisma.siteContent.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] });
    return NextResponse.json(content);
}

export async function PATCH(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updates: { key: string; value: string }[] = body.updates;

    for (const { key, value } of updates) {
        await prisma.siteContent.update({
            where: { key },
            data: { value, updatedBy: admin.id },
        });
    }

    return NextResponse.json({ success: true });
}