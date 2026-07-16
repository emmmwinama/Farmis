import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await prisma.field.findFirst({
        where: { id: params.id, farmId: session.farmId },
        include: {
            cropFields: {
                include: { cropType: true },
                orderBy: { createdAt: "desc" },
            },
            activities: {
                include: { cropField: { include: { cropType: true } } },
                orderBy: { date: "desc" },
                take: 10,
            },
        },
    });

    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    return NextResponse.json({
        id:               field.id,
        name:             field.name,
        totalArea:        field.totalArea,
        cultivatableArea: field.cultivatableArea,
        soilType:         field.soilType,
        locationLat:      field.locationLat,
        locationLng:      field.locationLng,
        notes:            field.notes,
        createdAt:        field.createdAt,
        allocatedArea:    field.cropFields
            .filter((c) => c.status === "Active")
            .reduce((s, c) => s + c.areaPlanted, 0),
        crops: field.cropFields.map((c) => ({
            id:                  c.id,
            cropTypeName:        c.cropType.name,
            variety:             c.variety,
            areaPlanted:         c.areaPlanted,
            season:              c.season,
            plantingDate:        c.plantingDate,
            expectedHarvestDate: c.expectedHarvestDate,
            status:              c.status,
        })),
        recentActivities: field.activities.map((a) => ({
            id:           a.id,
            activityType: a.activityType,
            date:         a.date,
            notes:        a.notes,
            cropName:     a.cropField?.cropType?.name ?? null,
        })),
    });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await prisma.field.findFirst({
        where: { id: params.id, farmId: session.farmId },
    });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const body = await req.json();

    const updated = await prisma.field.update({
        where: { id: params.id },
        data: {
            name:             body.name             ?? field.name,
            totalArea:        body.totalArea         ? parseFloat(body.totalArea)         : field.totalArea,
            cultivatableArea: body.cultivatableArea  ? parseFloat(body.cultivatableArea)  : field.cultivatableArea,
            soilType:         body.soilType          ?? field.soilType,
            locationLat:      body.locationLat       ? parseFloat(body.locationLat)       : field.locationLat,
            locationLng:      body.locationLng       ? parseFloat(body.locationLng)       : field.locationLng,
            notes:            body.notes             ?? field.notes,
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await prisma.field.findFirst({
        where: { id: params.id, farmId: session.farmId },
    });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    await prisma.field.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}