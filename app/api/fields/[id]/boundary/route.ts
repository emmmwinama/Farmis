import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Calculate area in hectares from GeoJSON polygon coordinates
// Uses the Shoelace formula with haversine correction
function calcAreaHa(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0;
    const R = 6371000; // Earth radius in meters
    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = (coordinates[i][1] * Math.PI) / 180;
        const lat2 = (coordinates[j][1] * Math.PI) / 180;
        const lng1 = (coordinates[i][0] * Math.PI) / 180;
        const lng2 = (coordinates[j][0] * Math.PI) / 180;
        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * R * R) / 2);
    return area / 10000; // convert m² to hectares
}

function calcCentroid(coordinates: number[][]): { lat: number; lng: number } {
    const lats = coordinates.map((c) => c[1]);
    const lngs = coordinates.map((c) => c[0]);
    return {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
}

export async function GET(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const boundary = await prisma.fieldBoundary.findUnique({
        where: { fieldId: params.id },
        include: { zones: { include: { cropField: { include: { cropType: true } } } } },
    });

    return NextResponse.json(boundary ?? null);
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await prisma.field.findUnique({ where: { id: params.id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const body = await req.json();
    const { geoJson } = body;

    const coords: number[][] =
        geoJson?.geometry?.coordinates?.[0] ?? geoJson?.coordinates?.[0] ?? [];

    const areaHa = calcAreaHa(coords);
    const centroid = calcCentroid(coords);

    const boundary = await prisma.fieldBoundary.upsert({
        where: { fieldId: params.id },
        update: {
            geoJson,
            areaHa,
            centroidLat: centroid.lat,
            centroidLng: centroid.lng,
            updatedAt: new Date(),
        },
        create: {
            fieldId: params.id,
            farmId: field.farmId,
            geoJson,
            areaHa,
            centroidLat: centroid.lat,
            centroidLng: centroid.lng,
        },
    });

    // Auto-update field total area from measured area
    if (areaHa > 0) {
        await prisma.field.update({
            where: { id: params.id },
            data: {
                totalArea: parseFloat(areaHa.toFixed(4)),
                cultivatableArea: parseFloat(areaHa.toFixed(4)),
            },
        });
    }

    return NextResponse.json(boundary, { status: 201 });
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.fieldBoundary.delete({ where: { fieldId: params.id } });
    return NextResponse.json({ success: true });
}