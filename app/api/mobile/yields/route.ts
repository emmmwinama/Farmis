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
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cropFieldId = searchParams.get("cropFieldId");

    // Get all fields for this farm
    const fields = await prisma.field.findMany({
        where:  { farmId: session.farmId },
        select: { id: true },
    });
    const fieldIds = fields.map((f) => f.id);

    // Get all crop fields for this farm
    const cropFields = await prisma.cropField.findMany({
        where:   { fieldId: { in: fieldIds } },
        select:  { id: true },
    });
    const cropFieldIds = cropFields.map((c) => c.id);

    const yields = await prisma.harvestYield.findMany({
        where: {
            cropFieldId: cropFieldId
                ? cropFieldId
                : { in: cropFieldIds },
        },
        include: {
            cropField: {
                include: {
                    cropType: true,
                    field:    true,
                },
            },
        },
        orderBy: { harvestDate: "desc" },
    });

    // Summary
    const totalKg = yields.reduce((s, y) => {
        const u = y.unit.toLowerCase();
        if (u === "kg")    return s + y.quantity;
        if (u === "tonne") return s + y.quantity * 1000;
        if (u.startsWith("bag")) return s + y.quantity * (y.unitWeight ?? 50);
        return s + y.quantity;
    }, 0);

    // Group by crop type
    const byCrop: Record<string, { count: number; totalKg: number }> = {};
    for (const y of yields) {
        const name = y.cropField.cropType.name;
        if (!byCrop[name]) byCrop[name] = { count: 0, totalKg: 0 };
        byCrop[name].count++;
        const u = y.unit.toLowerCase();
        if (u === "kg")    byCrop[name].totalKg += y.quantity;
        else if (u === "tonne") byCrop[name].totalKg += y.quantity * 1000;
        else if (u.startsWith("bag")) byCrop[name].totalKg += y.quantity * (y.unitWeight ?? 50);
        else byCrop[name].totalKg += y.quantity;
    }

    return NextResponse.json({
        yields: yields.map((y) => {
            const u  = y.unit.toLowerCase();
            let totalKg = y.quantity;
            if (u === "tonne") totalKg = y.quantity * 1000;
            else if (u.startsWith("bag")) totalKg = y.quantity * (y.unitWeight ?? 50);

            return {
                id:           y.id,
                harvestDate:  y.harvestDate,
                quantity:     y.quantity,
                unit:         y.unit,
                unitWeight:   y.unitWeight,
                notes:        y.notes,
                totalKg,
                cropFieldId:  y.cropFieldId,
                cropTypeName: y.cropField.cropType.name,
                variety:      y.cropField.variety,
                season:       y.cropField.season,
                fieldName:    y.cropField.field.name,
            };
        }),
        summary: {
            totalRecords: yields.length,
            totalKg,
            byCrop: Object.entries(byCrop).map(([crop, v]) => ({
                crop,
                count:   v.count,
                totalKg: v.totalKg,
            })),
        },
    });
}

export async function POST(req: NextRequest) {
    const session = getSession(req);
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { cropFieldId, harvestDate, quantity, unit, unitWeight, notes } = body;

    if (!cropFieldId || !harvestDate || !quantity || !unit) {
        return NextResponse.json(
            { error: "cropFieldId, harvestDate, quantity and unit are required" },
            { status: 400 }
        );
    }

    // Verify crop belongs to this farm
    const crop = await prisma.cropField.findFirst({
        where: {
            id:    cropFieldId,
            field: { farmId: session.farmId },
        },
    });
    if (!crop)
        return NextResponse.json({ error: "Crop not found" }, { status: 404 });

    const y = await prisma.harvestYield.create({
        data: {
            cropFieldId,
            harvestDate: new Date(harvestDate),
            quantity:    parseFloat(quantity),
            unit,
            unitWeight:  unitWeight ? parseFloat(unitWeight) : null,
            notes:       notes ?? null,
        },
    });

    return NextResponse.json(y, { status: 201 });
}