import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("yields", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const { harvestDate, quantity, unit, unitWeight, notes } = body;

    const existing = await prisma.harvestYield.findFirst({
        where: { id: params.id, cropField: { field: { farmId: access.farm.id } } },
    });
    if (!existing) return NextResponse.json({ error: "Yield record not found" }, { status: 404 });

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
    const access = await requireFarmPermission("yields", "write");
    if (access.error) return access.error;

    const existing = await prisma.harvestYield.findFirst({
        where: { id: params.id, cropField: { field: { farmId: access.farm.id } } },
    });
    if (!existing) return NextResponse.json({ error: "Yield record not found" }, { status: 404 });

    await prisma.harvestYield.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
