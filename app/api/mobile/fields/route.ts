import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { checkLimit } from "@/lib/subscription";

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fields = await prisma.field.findMany({
        where: { farmId: session.farmId },
        include: {
            cropFields: {
                where:   { status: "Active" },
                include: { cropType: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(fields.map((f) => ({
        id:               f.id,
        name:             f.name,
        totalArea:        f.totalArea,
        cultivatableArea: f.cultivatableArea,
        soilType:         f.soilType,
        locationLat:      f.locationLat,
        locationLng:      f.locationLng,
        notes:            f.notes,
        createdAt:        f.createdAt,
        allocatedArea:    f.cropFields.reduce((s, c) => s + c.areaPlanted, 0),
        cropCount:        f.cropFields.length,
        crops:            f.cropFields.map((c) => c.cropType.name),
    })));
}

export async function POST(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(session.userId, "Fields");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, totalArea, cultivatableArea, soilType, locationLat, locationLng, notes } = body;

    if (!name || !totalArea || !cultivatableArea || !soilType) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (parseFloat(cultivatableArea) > parseFloat(totalArea)) {
        return NextResponse.json(
            { error: "Cultivatable area cannot exceed total area" },
            { status: 400 }
        );
    }

    const field = await prisma.field.create({
        data: {
            farmId:           session.farmId,
            name,
            totalArea:        parseFloat(totalArea),
            cultivatableArea: parseFloat(cultivatableArea),
            soilType,
            locationLat:      locationLat ? parseFloat(locationLat) : null,
            locationLng:      locationLng ? parseFloat(locationLng) : null,
            notes:            notes ?? "",
        },
    });

    return NextResponse.json(field, { status: 201 });
}
