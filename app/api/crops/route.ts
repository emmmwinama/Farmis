import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");
    const showArchived = archivedParam === "true";
    const includeBoth = archivedParam === "both" || searchParams.get("includeArchived") === "both";
    const season       = searchParams.get("season");

    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "No farm" }, { status: 404 });

    const where: any = {
        field: { farmId: farm.id },
        ...(includeBoth ? {} : { isArchived: showArchived ? true : false }),
    };

    if (season) where.season = season;

    const crops = await prisma.cropField.findMany({
        where,
        include: {
            cropType:  true,
            field:     true,
            yields:    true,
            fieldZones: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(crops.map((c) => ({
        ...c,
        cropTypeName: c.cropType.name,
        fieldName:    c.field.name,
    })));
}

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(user.id, "Crops");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const {
        fieldId, cropTypeId, variety, areaPlanted,
        season, plantingDate, expectedHarvestDate,
    } = body;

    if (!fieldId || !cropTypeId || !variety || !areaPlanted || !season || !plantingDate || !expectedHarvestDate) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const field = await prisma.field.findUnique({
        where: { id: fieldId },
        include: { cropFields: { where: { status: "Active" } } },
    });

    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const allocated = field.cropFields.reduce((s, c) => s + c.areaPlanted, 0);
    const remaining = field.cultivatableArea - allocated;

    if (parseFloat(areaPlanted) > remaining) {
        return NextResponse.json(
            { error: `Only ${remaining.toFixed(2)} ha remaining in this field` },
            { status: 400 }
        );
    }

    const crop = await prisma.cropField.create({
        data: {
            fieldId,
            cropTypeId,
            variety,
            areaPlanted: parseFloat(areaPlanted),
            season,
            plantingDate: new Date(plantingDate),
            expectedHarvestDate: new Date(expectedHarvestDate),
        },
    });

    return NextResponse.json(crop, { status: 201 });
}
