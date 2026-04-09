import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

function toKg(quantity: number, unit: string, unitWeight: number | null): number {
    if (unit === "kg") return quantity;
    if (unit === "tonnes") return quantity * 1000;
    if (unitWeight) return quantity * unitWeight;
    return quantity;
}

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");
    const cropFieldId = searchParams.get("cropFieldId");

    const fieldIds = (
        await prisma.field.findMany({
            where: { farmId: farm.id },
            select: { id: true },
        })
    ).map((f) => f.id);

    const cropFields = await prisma.cropField.findMany({
        where: {
            fieldId: { in: fieldIds },
            ...(season ? { season } : {}),
            ...(cropFieldId ? { id: cropFieldId } : {}),
        },
        include: {
            cropType: true,
            field: true,
            yields: { orderBy: { harvestDate: "desc" } },
            activities: {
                include: {
                    labourRecords: true,
                    inputs: true,
                    otherCosts: true,
                },
            },
        },
    });

    const result = cropFields.map((cf) => {
        const labourCost = cf.activities
            .flatMap((a) => a.labourRecords)
            .reduce((s, l) => s + l.totalCost, 0);
        const inputCost = cf.activities
            .flatMap((a) => a.inputs)
            .reduce((s, i) => s + i.totalCost, 0);
        const otherCost = cf.activities
            .flatMap((a) => a.otherCosts)
            .reduce((s, o) => s + o.amount, 0);
        const totalCost = labourCost + inputCost + otherCost;

        const totalYieldKg = cf.yields.reduce(
            (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight),
            0
        );

        return {
            cropFieldId: cf.id,
            cropName: cf.cropType.name,
            variety: cf.variety,
            fieldName: cf.field.name,
            season: cf.season,
            areaPlanted: cf.areaPlanted,
            status: cf.status,
            plantingDate: cf.plantingDate,
            expectedHarvestDate: cf.expectedHarvestDate,
            totalCost,
            labourCost,
            inputCost,
            otherCost,
            costPerHectare: cf.areaPlanted > 0 ? totalCost / cf.areaPlanted : null,
            totalYieldKg,
            yieldPerHectare:
                totalYieldKg > 0 && cf.areaPlanted > 0
                    ? totalYieldKg / cf.areaPlanted
                    : null,
            costPerKg: totalYieldKg > 0 ? totalCost / totalYieldKg : null,
            yields: cf.yields,
        };
    });

    const byType: Record <string,
        { cropName: string; totalAreaPlanted: number; totalYieldKg: number; totalCost: number; records: number }
        > = {};
    for (const r of result) {
        if (!byType[r.cropName]) {
            byType[r.cropName] = {
                cropName: r.cropName,
                totalAreaPlanted: 0,
                totalYieldKg: 0,
                totalCost: 0,
                records: 0,
            };
        }
        byType[r.cropName].totalAreaPlanted += r.areaPlanted;
        byType[r.cropName].totalYieldKg += r.totalYieldKg;
        byType[r.cropName].totalCost += r.totalCost;
        byType[r.cropName].records += 1;
    }

    const allSeasons = [
        ...new Set(result.map((r) => r.season)),
    ].sort((a, b) => b.localeCompare(a));

    return NextResponse.json({
        records: result,
        byType: Object.values(byType).sort((a, b) => b.totalYieldKg - a.totalYieldKg),
        allSeasons,
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { cropFieldId, harvestDate, quantity, unit, unitWeight, notes } = body;

    if (!cropFieldId || !harvestDate || !quantity || !unit) {
        return NextResponse.json(
            { error: "Crop, date, quantity and unit are required" },
            { status: 400 }
        );
    }

    // Get crop field info for inventory naming
    const cropField = await prisma.cropField.findUnique({
        where: { id: cropFieldId },
        include: { cropType: true, field: true },
    });

    if (!cropField) {
        return NextResponse.json({ error: "Crop field not found" }, { status: 404 });
    }

    // Create the yield record
    const yieldRecord = await prisma.harvestYield.create({
        data: {
            cropFieldId,
            harvestDate: new Date(harvestDate),
            quantity: parseFloat(quantity),
            unit,
            unitWeight: unitWeight ? parseFloat(unitWeight) : null,
            notes: notes ?? "",
        },
    });

    // Auto-update crop status to Harvested
    await prisma.cropField.update({
        where: { id: cropFieldId },
        data: { status: "Harvested" },
    });

    // Auto-add to inventory
    await prisma.inventoryItem.create({
        data: {
            farmId: farm.id,
            name: `${cropField.cropType.name} — ${cropField.variety}`,
            category: "crop_harvest",
            unit,
            quantity: parseFloat(quantity),
            unitWeight: unitWeight ? parseFloat(unitWeight) : null,
            season: cropField.season,
            cropFieldId,
            harvestYieldId: yieldRecord.id,
            notes: `Auto-added from harvest on ${new Date(harvestDate).toLocaleDateString("en-GB")}. Field: ${cropField.field.name}.`,
        },
    });

    return NextResponse.json(yieldRecord, { status: 201 });
}