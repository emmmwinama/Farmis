import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fields = await prisma.field.findMany({
        where: { farmId: farm.id },
        include: {
            cropFields: {
                where: { status: "Active" },
                include: { cropType: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const result = fields.map((f) => ({
        id: f.id,
        name: f.name,
        totalArea: f.totalArea,
        cultivatableArea: f.cultivatableArea,
        soilType: f.soilType,
        locationLat: f.locationLat,
        locationLng: f.locationLng,
        notes: f.notes,
        createdAt: f.createdAt,
        allocatedArea: f.cropFields.reduce((s, c) => s + c.areaPlanted, 0),
        cropCount: f.cropFields.length,
        crops: f.cropFields.map((c) => c.cropType.name),
    }));

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    const access = await requireFarmPermission("fields", "write");
    if (access.error) return access.error;
    const { user, farm } = access;

    try {
        await checkLimit(user.id, "Fields");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, totalArea, cultivatableArea, soilType, locationLat, locationLng, notes } = body;

    if (!name || !totalArea || !cultivatableArea || !soilType) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (parseFloat(totalArea) <= 0 || parseFloat(cultivatableArea) <= 0) {
        return NextResponse.json({ error: "Area values must be greater than zero" }, { status: 400 });
    }

    if (parseFloat(cultivatableArea) > parseFloat(totalArea)) {
        return NextResponse.json(
            { error: "Cultivatable area cannot exceed total area" },
            { status: 400 }
        );
    }

    const duplicate = await prisma.field.findFirst({
        where: { farmId: farm.id, name: { equals: name.trim() } },
    });
    if (duplicate) {
        return NextResponse.json({ error: "A field with this name already exists" }, { status: 409 });
    }

    const field = await prisma.field.create({
        data: {
            farmId: farm.id,
            name: name.trim(),
            totalArea: parseFloat(totalArea),
            cultivatableArea: parseFloat(cultivatableArea),
            soilType,
            locationLat: locationLat ? parseFloat(locationLat) : null,
            locationLng: locationLng ? parseFloat(locationLng) : null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(field, { status: 201 });
}
