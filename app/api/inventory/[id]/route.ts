import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const access = await requireFarmPermission("finance", "write");
    if (access.error) return access.error;

    const existing = await prisma.inventoryItem.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

    const body = await req.json();
    const { name, category, unit, unitWeight, acquisitionUnitCost, acquiredAt, season, notes } = body;

    const item = await prisma.inventoryItem.update({
        where: { id: params.id },
        data: {
            name,
            category,
            unit,
            acquisitionUnitCost: acquisitionUnitCost ? parseFloat(acquisitionUnitCost) : null,
            acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
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
    const access = await requireFarmPermission("finance", "write");
    if (access.error) return access.error;

    const existing = await prisma.inventoryItem.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
