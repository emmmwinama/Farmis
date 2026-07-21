import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("crops", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const { variety, areaPlanted, season, plantingDate, expectedHarvestDate, status } = body;

    const existing = await prisma.cropField.findFirst({
        where: { id: params.id, field: { farmId: access.farm.id } },
    });
    if (!existing) return NextResponse.json({ error: "Crop record not found" }, { status: 404 });

    const crop = await prisma.cropField.update({
        where: { id: params.id },
        data: {
            variety,
            areaPlanted: parseFloat(areaPlanted),
            season,
            plantingDate: new Date(plantingDate),
            expectedHarvestDate: new Date(expectedHarvestDate),
            status,
        },
    });

    return NextResponse.json(crop);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("crops", "write");
    if (access.error) return access.error;

    const existing = await prisma.cropField.findFirst({
        where: { id: params.id, field: { farmId: access.farm.id } },
    });
    if (!existing) return NextResponse.json({ error: "Crop record not found" }, { status: 404 });

    await prisma.cropField.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
