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
    const {
        type, category, amount, date, description,
        season, fieldId, cropFieldId, harvestYieldId,
    } = body;

    const transaction = await prisma.transaction.update({
        where: { id: params.id },
        data: {
            type,
            category,
            amount: parseFloat(amount),
            date: new Date(date),
            description,
            season: season || null,
            fieldId: fieldId || null,
            cropFieldId: cropFieldId || null,
            harvestYieldId: harvestYieldId || null,
        },
    });

    return NextResponse.json(transaction);
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}