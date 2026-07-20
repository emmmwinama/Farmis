import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import { requireFarmPermission } from "@/lib/roleAccess";

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
            activities: {
                orderBy: { date: "desc" },
                select: { id: true, activityType: true, date: true },
            },
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
    const access = await requireFarmPermission("crops", "write");
    if (access.error) return access.error;
    const { user, farm } = access;

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

    if (!fieldId || !cropTypeId || !variety || !areaPlanted || !season) {
        return NextResponse.json({ error: "Field, crop, variety, area and season are required" }, { status: 400 });
    }

    const plantedAt = plantingDate ? new Date(plantingDate) : new Date();
    const harvestAt = expectedHarvestDate ? new Date(expectedHarvestDate) : new Date(plantedAt.getTime() + 120 * 86400000);
    if (Number.isNaN(plantedAt.getTime()) || Number.isNaN(harvestAt.getTime())) {
        return NextResponse.json({ error: "Crop schedule dates must be valid" }, { status: 400 });
    }
    if (harvestAt <= plantedAt) {
        return NextResponse.json({ error: "Expected harvest date must be after planting date" }, { status: 400 });
    }
    if (parseFloat(areaPlanted) <= 0) {
        return NextResponse.json({ error: "Area planted must be greater than zero" }, { status: 400 });
    }

    const field = await prisma.field.findUnique({
        where: { id: fieldId },
        include: { cropFields: { where: { status: "Active", isArchived: false } } },
    });

    if (!field || field.farmId !== farm.id) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const duplicate = await prisma.cropField.findFirst({
        where: {
            fieldId,
            cropTypeId,
            season: season.trim(),
            variety: { equals: variety.trim() },
            isArchived: false,
        },
    });
    if (duplicate) {
        return NextResponse.json({ error: "This crop, variety, field, and season already exists" }, { status: 409 });
    }

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
            variety: variety.trim(),
            areaPlanted: parseFloat(areaPlanted),
            season: season.trim(),
            plantingDate: plantedAt,
            expectedHarvestDate: harvestAt,
        },
    });

    return NextResponse.json(crop, { status: 201 });
}
