import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, category, unit, quantity, unitWeight, season, notes } = body;

    const item = await prisma.inventoryItem.update({
        where: { id: params.id },
        data: {
            name,
            category,
            unit,
            quantity: parseFloat(quantity),
            unitWeight: unitWeight ? parseFloat(unitWeight) : null,
            season: season || null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(item);
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.inventoryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}