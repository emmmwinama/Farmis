import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function calcAreaHa(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0;
    const R = 6371000;
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
    return Math.abs((area * R * R) / 2) / 10000;
}

export async function GET(
    _: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const boundary = await prisma.fieldBoundary.findUnique({
        where: { fieldId: params.id },
    });

    if (!boundary) return NextResponse.json([]);

    const zones = await prisma.fieldZone.findMany({
        where: { boundaryId: boundary.id },
        include: { cropField: { include: { cropType: true } } },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(zones);
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

    const boundary = await prisma.fieldBoundary.findUnique({
        where: { fieldId: params.id },
    });
    if (!boundary)
        return NextResponse.json({ error: "Draw the field boundary first" }, { status: 400 });

    const body = await req.json();
    const { name, type, cropFieldId, geoJson, colour, notes } = body;

    const coords: number[][] =
        geoJson?.geometry?.coordinates?.[0] ?? geoJson?.coordinates?.[0] ?? [];
    const areaHa = calcAreaHa(coords);

    const zone = await prisma.fieldZone.create({
        data: {
            boundaryId:  boundary.id,
            fieldId:     params.id,
            farmId:      field.farmId,
            name:        name || "Zone",
            type:        type || "crop",
            cropFieldId: cropFieldId || null,
            geoJson,
            areaHa,
            colour:      colour || null,
            notes:       notes || null,
        },
        include: { cropField: { include: { cropType: true } } },
    });

    return NextResponse.json(zone, { status: 201 });
}