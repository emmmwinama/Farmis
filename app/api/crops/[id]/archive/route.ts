import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reason } = await req.json().catch(() => ({}));

    const updated = await prisma.cropField.update({
        where: { id: params.id },
        data:  { isArchived: true, archivedAt: new Date(), archivedReason: reason ?? null, status: "Archived" },
    });
    return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const updated = await prisma.cropField.update({
        where: { id: params.id },
        data:  { isArchived: false, archivedAt: null, archivedReason: null, status: "Active" },
    });
    return NextResponse.json(updated);
}