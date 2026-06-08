import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

function getSession(req: NextRequest) {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), JWT_SECRET) as {
            userId: string; farmId: string; email: string; role: string;
        };
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived");

    const fields = await prisma.field.findMany({
        where: { farmId: session.farmId },
        include: {
            cropFields: {
                where: archived === "true"
                    ? { status: "Archived" }
                    : archived === "false"
                        ? { status: { not: "Archived" } }
                        : {},
                include: { cropType: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    const crops = fields.flatMap((f) =>
        f.cropFields.map((c) => ({
            id:                  c.id,
            cropTypeName:        c.cropType.name,
            cropTypeId:          c.cropTypeId,
            variety:             c.variety,
            areaPlanted:         c.areaPlanted,
            season:              c.season,
            plantingDate:        c.plantingDate,
            expectedHarvestDate: c.expectedHarvestDate,
            status:              c.status,
            fieldId:             f.id,
            fieldName:           f.name,
            fieldCultivatable:   f.cultivatableArea,
            createdAt:           c.createdAt,
        }))
    );

    return NextResponse.json(crops);
}

export async function POST(req: NextRequest) {
    const session = getSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        fieldId, cropTypeId, variety, areaPlanted,
        season, plantingDate, expectedHarvestDate,
    } = body;

    if (!fieldId || !cropTypeId || !variety || !areaPlanted ||
        !season || !plantingDate || !expectedHarvestDate) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Verify field belongs to this farm
    const field = await prisma.field.findFirst({
        where: { id: fieldId, farmId: session.farmId },
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
            areaPlanted:         parseFloat(areaPlanted),
            season,
            plantingDate:        new Date(plantingDate),
            expectedHarvestDate: new Date(expectedHarvestDate),
        },
        include: { cropType: true, field: true },
    });

    return NextResponse.json({
        id:                  crop.id,
        cropTypeName:        crop.cropType.name,
        cropTypeId:          crop.cropTypeId,
        variety:             crop.variety,
        areaPlanted:         crop.areaPlanted,
        season:              crop.season,
        plantingDate:        crop.plantingDate,
        expectedHarvestDate: crop.expectedHarvestDate,
        status:              crop.status,
        fieldId:             crop.field.id,
        fieldName:           crop.field.name,
    }, { status: 201 });
}