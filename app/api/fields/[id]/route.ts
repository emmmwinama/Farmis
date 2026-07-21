import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("fields", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const { name, totalArea, cultivatableArea, soilType, locationLat, locationLng, notes } = body;

    const existing = await prisma.field.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    if (parseFloat(cultivatableArea) > parseFloat(totalArea)) {
        return NextResponse.json(
            { error: "Cultivatable area cannot exceed total area" },
            { status: 400 }
        );
    }

    const field = await prisma.field.update({
        where: { id: params.id },
        data: {
            name,
            totalArea: parseFloat(totalArea),
            cultivatableArea: parseFloat(cultivatableArea),
            soilType,
            locationLat: locationLat ? parseFloat(locationLat) : null,
            locationLng: locationLng ? parseFloat(locationLng) : null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(field);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("fields", "write");
    if (access.error) return access.error;

    const existing = await prisma.field.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    await prisma.field.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}

export async function GET(
    _: Request,
    { params }: { params: { id: string } }
) {
    const access = await requireFarmPermission("fields");
    if (access.error) return access.error;

    const field = await prisma.field.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });

    if (!field) {
        return NextResponse.json(
            { error: "Field not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(field);
}
