import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const totalValue = body.pricePerUnit ? parseFloat(body.quantity) * parseFloat(body.pricePerUnit) : null;

    const record = await prisma.animalProduction.update({
        where: { id: params.id },
        data: {
            type:         body.type,
            quantity:     parseFloat(body.quantity),
            unit:         body.unit,
            date:         new Date(body.date),
            pricePerUnit: body.pricePerUnit ? parseFloat(body.pricePerUnit) : null,
            totalValue,
            notes:        body.notes || null,
        },
    });

    return NextResponse.json(record);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.animalProduction.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}