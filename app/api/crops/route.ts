import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fields = await prisma.field.findMany({
        where: { farmId: farm.id },
        include: {
            cropFields: {
                include: { cropType: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    const cropFields = fields.flatMap((f) =>
        f.cropFields.map((c) => ({
            id: c.id,
            cropTypeName: c.cropType.name,
            cropTypeId: c.cropTypeId,
            variety: c.variety,
            areaPlanted: c.areaPlanted,
            season: c.season,
            plantingDate: c.plantingDate,
            expectedHarvestDate: c.expectedHarvestDate,
            status: c.status,
            fieldId: f.id,
            fieldName: f.name,
            fieldCultivatable: f.cultivatableArea,
        }))
    );

    return NextResponse.json(cropFields);
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