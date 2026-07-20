import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

function toKg(quantity: number, unit: string, unitWeight?: number | null) {
    const u = unit.toLowerCase();
    if (u === "kg")    return quantity;
    if (u === "tonne") return quantity * 1000;
    if (u.startsWith("bag")) return quantity * (unitWeight ?? 50);
    return quantity;
}

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const seasonFilter = searchParams.get("season");
    const fieldIdFilter = searchParams.get("fieldId");
    const cropFieldIdFilter = searchParams.get("cropFieldId");
    const includeArchived = searchParams.get("includeArchived");
    const fromFilter = searchParams.get("from");
    const toFilter = searchParams.get("to");
    const fromDate = fromFilter ? new Date(fromFilter) : null;
    const toDate = toFilter ? new Date(toFilter) : null;
    const hasDateFilter = Boolean(fromDate || toDate);
    const dateWhere = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
    };

    // ── Fetch all data ──────────────────────────────────────────
    const fields = await prisma.field.findMany({
        where:  {
            farmId: session.farmId,
            ...(fieldIdFilter ? { id: fieldIdFilter } : {}),
        },
        include: { cropFields: { include: {
                    cropType:  true,
                    activities: { include: {
                            inputs:        true,
                            labourRecords: { include: { employee: true } },
                            otherCosts:    true,
                        },
                        ...(hasDateFilter ? { where: { date: dateWhere } } : {}),
                    },
                    yields: {
                        ...(hasDateFilter ? { where: { harvestDate: dateWhere } } : {}),
                    },
                },
                where: {
                    ...(seasonFilter ? { season: seasonFilter } : {}),
                    ...(cropFieldIdFilter ? { id: cropFieldIdFilter } : {}),
                    ...(includeArchived === "false" ? { isArchived: false } : {}),
                    ...(includeArchived === "true" ? { isArchived: true } : {}),
                },
            }},
    });

    const transactions = await prisma.transaction.findMany({
        where: {
            farmId: session.farmId,
            ...(seasonFilter ? { season: seasonFilter } : {}),
            ...(fieldIdFilter ? { fieldId: fieldIdFilter } : {}),
            ...(cropFieldIdFilter ? { cropFieldId: cropFieldIdFilter } : {}),
            ...(hasDateFilter ? { date: dateWhere } : {}),
            ...(includeArchived === "false" ? { cropField: { isArchived: false } } : {}),
            ...(includeArchived === "true" ? { cropField: { isArchived: true } } : {}),
        },
    });

    const overhead = await prisma.overheadExpense.findMany({
        where: {
            farmId: session.farmId,
            ...(hasDateFilter ? { date: dateWhere } : {}),
        },
    });

    // ── Finance summary ─────────────────────────────────────────
    const totalIncome = transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);

    const allActivities = fields.flatMap((f) =>
        f.cropFields.flatMap((c) => c.activities));

    const totalActivityCost = allActivities.reduce((s, a) => {
        const inputs  = a.inputs.reduce((x, i) => x + i.totalCost, 0);
        const labour  = a.labourRecords.reduce((x, l) => x + l.totalCost, 0);
        const other   = a.otherCosts.reduce((x, o) => x + o.amount, 0);
        return s + inputs + labour + other;
    }, 0);

    const totalOverheadCost = overhead
        .reduce((s, o) => s + o.amount, 0);

    const financeSummary = {
        totalIncome,
        totalActivityCost,
        totalOverheadCost,
        net: totalIncome - totalActivityCost - totalOverheadCost,
    };

    // ── Season report ───────────────────────────────────────────
    const seasonMap: Record<string, {
        fields: Set<string>; crops: Set<string>;
        totalArea: number; cropCount: number;
        labourCost: number; inputCost: number;
        otherCost: number; totalCost: number;
    }> = {};

    for (const field of fields) {
        for (const crop of field.cropFields) {
            const s = crop.season;
            if (!seasonMap[s]) {
                seasonMap[s] = {
                    fields: new Set(), crops: new Set(),
                    totalArea: 0, cropCount: 0,
                    labourCost: 0, inputCost: 0,
                    otherCost: 0, totalCost: 0,
                };
            }
            seasonMap[s].fields.add(field.name);
            seasonMap[s].crops.add(crop.cropType.name);
            seasonMap[s].totalArea  += crop.areaPlanted;
            seasonMap[s].cropCount  += 1;

            for (const a of crop.activities) {
                const ic = a.inputs.reduce((x, i) => x + i.totalCost, 0);
                const lc = a.labourRecords.reduce((x, l) => x + l.totalCost, 0);
                const oc = a.otherCosts.reduce((x, o) => x + o.amount, 0);
                seasonMap[s].inputCost  += ic;
                seasonMap[s].labourCost += lc;
                seasonMap[s].otherCost  += oc;
                seasonMap[s].totalCost  += ic + lc + oc;
            }
        }
    }

    const seasonReport = Object.entries(seasonMap)
        .map(([season, v]) => ({
            season,
            fields:          [...v.fields],
            crops:           [...v.crops],
            totalArea:       v.totalArea,
            cropCount:       v.cropCount,
            labourCost:      v.labourCost,
            inputCost:       v.inputCost,
            otherCost:       v.otherCost,
            totalCost:       v.totalCost,
            costPerHectare:  v.totalArea > 0
                ? v.totalCost / v.totalArea : 0,
        }))
        .sort((a, b) => b.season.localeCompare(a.season));

    // ── Crop report ─────────────────────────────────────────────
    const cropMap: Record<string, {
        seasons: Set<string>; totalArea: number; count: number;
        labourCost: number; inputCost: number; totalCost: number;
    }> = {};

    for (const field of fields) {
        for (const crop of field.cropFields) {
            const name = crop.cropType.name;
            if (!cropMap[name]) {
                cropMap[name] = {
                    seasons: new Set(), totalArea: 0, count: 0,
                    labourCost: 0, inputCost: 0, totalCost: 0,
                };
            }
            cropMap[name].seasons.add(crop.season);
            cropMap[name].totalArea += crop.areaPlanted;
            cropMap[name].count     += 1;

            for (const a of crop.activities) {
                const ic = a.inputs.reduce((x, i) => x + i.totalCost, 0);
                const lc = a.labourRecords.reduce((x, l) => x + l.totalCost, 0);
                const oc = a.otherCosts.reduce((x, o) => x + o.amount, 0);
                cropMap[name].inputCost  += ic;
                cropMap[name].labourCost += lc;
                cropMap[name].totalCost  += ic + lc + oc;
            }
        }
    }

    const cropReport = Object.entries(cropMap)
        .map(([cropName, v]) => ({
            cropName,
            seasons:        [...v.seasons],
            totalArea:      v.totalArea,
            count:          v.count,
            labourCost:     v.labourCost,
            inputCost:      v.inputCost,
            totalCost:      v.totalCost,
            costPerHectare: v.totalArea > 0
                ? v.totalCost / v.totalArea : 0,
        }))
        .sort((a, b) => b.totalCost - a.totalCost);

    // ── Field report ────────────────────────────────────────────
    const fieldReport = fields.map((field) => {
        let labourCost = 0, inputCost = 0, totalCost = 0;
        let totalAreaPlanted = 0;
        const crops = new Set<string>();

        for (const crop of field.cropFields) {
            totalAreaPlanted += crop.areaPlanted;
            crops.add(crop.cropType.name);
            for (const a of crop.activities) {
                const ic = a.inputs.reduce((x, i) => x + i.totalCost, 0);
                const lc = a.labourRecords.reduce((x, l) => x + l.totalCost, 0);
                const oc = a.otherCosts.reduce((x, o) => x + o.amount, 0);
                inputCost  += ic;
                labourCost += lc;
                totalCost  += ic + lc + oc;
            }
        }

        return {
            fieldId:         field.id,
            fieldName:       field.name,
            soilType:        field.soilType,
            totalArea:       field.totalArea,
            totalAreaPlanted,
            crops:           [...crops],
            labourCost,
            inputCost,
            totalCost,
            costPerHectare: field.totalArea > 0
                ? totalCost / field.totalArea : 0,
        };
    }).sort((a, b) => b.totalCost - a.totalCost);

    // ── Crop-field detail ───────────────────────────────────────
    const cropFieldDetail = fields.flatMap((field) =>
        field.cropFields.map((crop) => {
            const inputCost  = crop.activities
                .flatMap((a) => a.inputs)
                .reduce((s, i) => s + i.totalCost, 0);
            const labourCost = crop.activities
                .flatMap((a) => a.labourRecords)
                .reduce((s, l) => s + l.totalCost, 0);
            const otherCost  = crop.activities
                .flatMap((a) => a.otherCosts)
                .reduce((s, o) => s + o.amount, 0);
            const totalCost  = inputCost + labourCost + otherCost;

            return {
                id:             crop.id,
                cropName:       crop.cropType.name,
                variety:        crop.variety,
                fieldName:      field.name,
                season:         crop.season,
                areaPlanted:    crop.areaPlanted,
                status:         crop.status,
                labour:         labourCost,
                inputs:         inputCost,
                other:          otherCost,
                totalCost,
                costPerHectare: crop.areaPlanted > 0
                    ? totalCost / crop.areaPlanted : 0,
            };
        })
    );

    // ── Employee report ─────────────────────────────────────────
    const employeeMap: Record<string, {
        name: string; role: string; activities: number;
        totalDays: number; totalHours: number; totalEarned: number;
    }> = {};

    for (const field of fields) {
        for (const crop of field.cropFields) {
            for (const a of crop.activities) {
                for (const l of a.labourRecords) {
                    const id = l.employee.id;
                    if (!employeeMap[id]) {
                        employeeMap[id] = {
                            name:        l.employee.name,
                            role:        l.employee.role,
                            activities:  0,
                            totalDays:   0,
                            totalHours:  0,
                            totalEarned: 0,
                        };
                    }
                    employeeMap[id].activities  += 1;
                    employeeMap[id].totalDays   += l.daysWorked;
                    employeeMap[id].totalHours  += l.hoursWorked;
                    employeeMap[id].totalEarned += l.totalCost;
                }
            }
        }
    }

    const employeeReport = Object.entries(employeeMap)
        .map(([employeeId, v]) => ({ employeeId, ...v }))
        .sort((a, b) => b.totalEarned - a.totalEarned);

    // ── Input report ────────────────────────────────────────────
    const inputMap: Record<string, {
        category: string; unit: string;
        totalQuantity: number; usageCount: number; totalCost: number;
    }> = {};

    for (const field of fields) {
        for (const crop of field.cropFields) {
            for (const a of crop.activities) {
                for (const i of a.inputs) {
                    if (!inputMap[i.inputName]) {
                        inputMap[i.inputName] = {
                            category:      i.category,
                            unit:          i.unit,
                            totalQuantity: 0,
                            usageCount:    0,
                            totalCost:     0,
                        };
                    }
                    inputMap[i.inputName].totalQuantity += i.quantity;
                    inputMap[i.inputName].usageCount    += 1;
                    inputMap[i.inputName].totalCost     += i.totalCost;
                }
            }
        }
    }

    const inputReport = Object.entries(inputMap)
        .map(([inputName, v]) => ({ inputName, ...v }))
        .sort((a, b) => b.totalCost - a.totalCost);

    // ── Yields report ───────────────────────────────────────────
    const yieldTypeMap: Record<string, {
        records: number; totalAreaPlanted: number;
        totalYieldKg: number; totalCost: number;
    }> = {};

    const yieldDetailRecords = fields.flatMap((field) =>
        field.cropFields.map((crop) => {
            const totalYieldKg = crop.yields.reduce(
                (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);

            const totalCost = crop.activities.reduce((s, a) => {
                const ic = a.inputs.reduce((x, i) => x + i.totalCost, 0);
                const lc = a.labourRecords.reduce((x, l) => x + l.totalCost, 0);
                const oc = a.otherCosts.reduce((x, o) => x + o.amount, 0);
                return s + ic + lc + oc;
            }, 0);

            const name = crop.cropType.name;
            if (!yieldTypeMap[name]) {
                yieldTypeMap[name] = {
                    records: 0, totalAreaPlanted: 0,
                    totalYieldKg: 0, totalCost: 0,
                };
            }
            yieldTypeMap[name].records         += crop.yields.length;
            yieldTypeMap[name].totalAreaPlanted += crop.areaPlanted;
            yieldTypeMap[name].totalYieldKg     += totalYieldKg;
            yieldTypeMap[name].totalCost        += totalCost;

            return {
                cropFieldId:  crop.id,
                cropName:     name,
                variety:      crop.variety,
                fieldName:    field.name,
                season:       crop.season,
                areaPlanted:  crop.areaPlanted,
                totalYieldKg,
                totalCost,
                costPerKg: totalYieldKg > 0
                    ? totalCost / totalYieldKg : 0,
                yieldPerHa: crop.areaPlanted > 0
                    ? totalYieldKg / crop.areaPlanted : 0,
            };
        })
    ).filter((r) => r.totalYieldKg > 0);

    const yieldByType = Object.entries(yieldTypeMap)
        .map(([cropName, v]) => ({
            cropName,
            ...v,
            yieldPerHa: v.totalAreaPlanted > 0
                ? v.totalYieldKg / v.totalAreaPlanted : 0,
            costPerKg: v.totalYieldKg > 0
                ? v.totalCost / v.totalYieldKg : 0,
        }))
        .sort((a, b) => b.totalYieldKg - a.totalYieldKg);

    return NextResponse.json({
        filters: {
            season: seasonFilter ?? "all",
            fieldId: fieldIdFilter ?? "all",
            cropFieldId: cropFieldIdFilter ?? "all",
            includeArchived: includeArchived ?? "both",
            from: fromFilter,
            to: toFilter,
        },
        financeSummary,
        seasonReport,
        cropReport,
        fieldReport,
        cropFieldDetail,
        employeeReport,
        inputReport,
        yieldsReport: {
            byType:  yieldByType,
            records: yieldDetailRecords,
        },
    });
}
