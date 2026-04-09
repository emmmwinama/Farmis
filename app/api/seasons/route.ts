import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const seasonFilter = searchParams.get("season");

    const fields = await prisma.field.findMany({
        where: { farmId: farm.id },
        include: {
            cropFields: {
                where: seasonFilter ? { season: seasonFilter } : undefined,
                include: {
                    cropType: true,
                    activities: {
                        include: { labourRecords: true, inputs: true, otherCosts: true },
                    },
                },
            },
        },
    });

    const allCropFields = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "desc" },
    });
    const allSeasons = allCropFields.map((c) => c.season);

    const cropFields = fields.flatMap((f) =>
        f.cropFields.map((c) => {
            const labourCost = c.activities
                .flatMap((a) => a.labourRecords)
                .reduce((s, l) => s + l.totalCost, 0);
            const inputCost = c.activities
                .flatMap((a) => a.inputs)
                .reduce((s, i) => s + i.totalCost, 0);
            const otherCost = c.activities
                .flatMap((a) => a.otherCosts)
                .reduce((s, o) => s + o.amount, 0);
            return {
                id: c.id,
                cropTypeName: c.cropType.name,
                variety: c.variety,
                areaPlanted: c.areaPlanted,
                season: c.season,
                plantingDate: c.plantingDate,
                expectedHarvestDate: c.expectedHarvestDate,
                status: c.status,
                fieldName: f.name,
                activityCount: c.activities.length,
                totalCost: labourCost + inputCost + otherCost,
            };
        })
    );

    const byType: Record<
        string,
        {
            name: string;
            totalArea: number;
            count: number;
            totalCost: number;
            statuses: string[];
        }
    > = {};

    for (const c of cropFields) {
        if (!byType[c.cropTypeName])
            byType[c.cropTypeName] = {
                name: c.cropTypeName,
                totalArea: 0,
                count: 0,
                totalCost: 0,
                statuses: [],
            };
        byType[c.cropTypeName].totalArea += c.areaPlanted;
        byType[c.cropTypeName].count += 1;
        byType[c.cropTypeName].totalCost += c.totalCost;
        byType[c.cropTypeName].statuses.push(c.status);
    }

    const activities = await prisma.farmActivity.findMany({
        where: {
            fieldId: { in: fields.map((f) => f.id) },
            cropField: seasonFilter ? { season: seasonFilter } : undefined,
        },
        include: {
            field: true,
            cropField: { include: { cropType: true } },
            labourRecords: true,
            inputs: true,
            otherCosts: true,
        },
        orderBy: { date: "desc" },
    });

    const activitySummary = activities.map((a) => ({
        id: a.id,
        activityType: a.activityType,
        fieldName: a.field.name,
        cropName: a.cropField?.cropType?.name ?? null,
        date: a.date,
        totalCost:
            a.labourRecords.reduce((s, l) => s + l.totalCost, 0) +
            a.inputs.reduce((s, i) => s + i.totalCost, 0) +
            a.otherCosts.reduce((s, o) => s + o.amount, 0),
    }));

    return NextResponse.json({
        allSeasons,
        cropFields,
        byType: Object.values(byType).sort((a, b) => b.totalArea - a.totalArea),
        activities: activitySummary,
        totals: {
            area: cropFields.reduce((s, c) => s + c.areaPlanted, 0),
            crops: cropFields.length,
            activities: activitySummary.length,
            cost: activitySummary.reduce((s, a) => s + a.totalCost, 0),
        },
    });
}