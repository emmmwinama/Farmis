import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const access = await requireFarmPermission("finance", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const {
        type, category, amount, date, description,
        season, fieldId, cropFieldId, harvestYieldId,
    } = body;

    const existing = await prisma.transaction.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

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
    const access = await requireFarmPermission("finance", "write");
    if (access.error) return access.error;

    const existing = await prisma.transaction.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
