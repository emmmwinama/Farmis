import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const markers = await prisma.farmMarker.findMany({
        where: { farmId: farm.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(markers);
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, label, lat, lng, fieldId, notes, icon } = body;

    if (!type || !label || lat === undefined || lng === undefined) {
        return NextResponse.json(
            { error: "Type, label, lat and lng are required" },
            { status: 400 }
        );
    }

    const marker = await prisma.farmMarker.create({
        data: {
            farmId:  farm.id,
            type,
            label,
            lat:     parseFloat(lat),
            lng:     parseFloat(lng),
            fieldId: fieldId || null,
            notes:   notes || null,
            icon:    icon || null,
        },
    });

    return NextResponse.json(marker, { status: 201 });
}