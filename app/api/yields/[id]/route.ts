import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { harvestDate, quantity, unit, unitWeight, notes } = body;

    const yieldRecord = await prisma.harvestYield.update({
        where: { id: params.id },
        data: {
            harvestDate: new Date(harvestDate),
            quantity: parseFloat(quantity),
            unit,
            unitWeight: unitWeight ? parseFloat(unitWeight) : null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(yieldRecord);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.harvestYield.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}