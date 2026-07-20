import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

function toKg(quantity: number, unit: string, unitWeight?: number | null) {
    const u = unit.toLowerCase().trim();
    if (u === "kg")                 return quantity;
    if (u === "tonne" || u === "t") return quantity * 1000;
    if (u.startsWith("bag"))        return quantity * (unitWeight ?? 50);
    return quantity;
}

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const seasonFilter = searchParams.get("season");
    const includeArchived = searchParams.get("includeArchived");
    const fieldIdFilter = searchParams.get("fieldId");
    const cropFieldIdFilter = searchParams.get("cropFieldId");
    const fromFilter = searchParams.get("from");
    const toFilter = searchParams.get("to");
    const fromDate = fromFilter ? new Date(fromFilter) : null;
    const toDate = toFilter ? new Date(toFilter) : null;
    const hasDateFilter = Boolean(fromDate || toDate);
    const dateWhere = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
    };

    // ── Fetch all fields with full relations ────────────────────────────────
    const allFields = await prisma.field.findMany({
        where: {
            farmId: farm.id,
            ...(fieldIdFilter ? { id: fieldIdFilter } : {}),
        },
        include: {
            cropFields: {
                where: {
                    ...(seasonFilter ? { season: seasonFilter } : {}),
                    ...(cropFieldIdFilter ? { id: cropFieldIdFilter } : {}),
                    ...(includeArchived === "false" ? { isArchived: false } : {}),
                    ...(includeArchived === "true" ? { isArchived: true } : {}),
                },
                include: {
                    cropType:   true,
                    activities: {
                        ...(hasDateFilter ? { where: { date: dateWhere } } : {}),
                        include: {
                            inputs:        true,
                            labourRecords: true,
                            otherCosts:    true,
                        },
                    },
                    yields:       {
                        ...(hasDateFilter ? { where: { harvestDate: dateWhere } } : {}),
                    },
                    transactions: {
                        ...(hasDateFilter ? { where: { date: dateWhere } } : {}),
                    },
                },
            },
        },
    });

    // ── Fetch overhead expenses ─────────────────────────────────────────────
    const overheadExpenses = await prisma.overheadExpense.findMany({
        where:   {
            farmId: farm.id,
            ...(hasDateFilter ? { date: dateWhere } : {}),
        },
        orderBy: { date: "asc" },
    });

    // ── Overhead allocation ─────────────────────────────────────────────────
    // Iterate directly over allFields to avoid TypeScript spread type loss.
    // Each crop gets a fixed share based on area — same logic as /api/reports.
    const overheadAllocation: Record<string, number> = {};

    for (const oh of overheadExpenses) {
        const expDate = new Date(oh.date);

        const growingThen: Array<{ id: string; areaPlanted: number }> = [];

        for (const field of allFields) {
            for (const crop of field.cropFields) {
                const planted   = new Date(crop.plantingDate);
                const harvested = new Date(crop.expectedHarvestDate);
                if (planted <= expDate && harvested >= expDate) {
                    growingThen.push({
                        id:          crop.id,
                        areaPlanted: crop.areaPlanted,
                    });
                }
            }
        }

        const totalArea = growingThen.reduce((s, c) => s + c.areaPlanted, 0);
        if (totalArea === 0) continue;

        for (const c of growingThen) {
            const share = (c.areaPlanted / totalArea) * oh.amount;
            overheadAllocation[c.id] =
                (overheadAllocation[c.id] ?? 0) + share;
        }
    }

    // ── Per-crop-field stats ────────────────────────────────────────────────
    // Iterate directly over allFields.cropFields — no spread, no type loss.
    const cropFieldStats = allFields.flatMap((field) =>
        field.cropFields.map((crop) => {
            const inputCost = crop.activities
                .flatMap((a) => a.inputs)
                .reduce((s, i) => s + i.totalCost, 0);

            const labourCost = crop.activities
                .flatMap((a) => a.labourRecords)
                .reduce((s, l) => s + l.totalCost, 0);

            const otherCost = crop.activities
                .flatMap((a) => a.otherCosts)
                .reduce((s, o) => s + o.amount, 0);

            const overhead  = overheadAllocation[crop.id] ?? 0;
            const totalCost = inputCost + labourCost + otherCost + overhead;

            const totalYieldKg = crop.yields.reduce(
                (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0
            );

            const revenue = crop.transactions
                .filter((t) => t.type === "Income")
                .reduce((s, t) => s + t.amount, 0);

            return {
                id:           crop.id,
                cropName:     crop.cropType.name,
                season:       crop.season,
                areaPlanted:  crop.areaPlanted,
                status:       crop.status,
                fieldName:    field.name,
                yieldRecords: crop.yields.length,
                inputCost,
                labourCost,
                otherCost,
                overhead,
                totalCost,
                totalYieldKg,
                revenue,
                costPerHa:  crop.areaPlanted > 0
                    ? totalCost    / crop.areaPlanted : 0,
                yieldPerHa: crop.areaPlanted > 0
                    ? totalYieldKg / crop.areaPlanted : 0,
                costPerKg:  totalYieldKg > 0
                    ? totalCost    / totalYieldKg     : 0,
                netProfit:  revenue - totalCost,
            };
        })
    );

    // ── All unique seasons sorted chronologically ───────────────────────────
    const allSeasons = [
        ...new Set(cropFieldStats.map((c) => c.season)),
    ].sort((a, b) => a.localeCompare(b));

    // ── All unique crop types ───────────────────────────────────────────────
    const allCropTypes = [
        ...new Set(cropFieldStats.map((c) => c.cropName)),
    ].sort();

    // ── 1. Yield trend map ──────────────────────────────────────────────────
    const yieldTrendMap: Record<string, Record<string, {
        totalKg:    number;
        totalArea:  number;
        yieldPerHa: number;
        records:    number;
    }>> = {};

    for (const c of cropFieldStats) {
        if (!yieldTrendMap[c.cropName])
            yieldTrendMap[c.cropName] = {};

        if (!yieldTrendMap[c.cropName][c.season]) {
            yieldTrendMap[c.cropName][c.season] = {
                totalKg: 0, totalArea: 0, yieldPerHa: 0, records: 0,
            };
        }

        const entry = yieldTrendMap[c.cropName][c.season];
        entry.totalKg   += c.totalYieldKg;
        entry.totalArea += c.areaPlanted;
        entry.records   += c.yieldRecords;
        entry.yieldPerHa = entry.totalArea > 0
            ? entry.totalKg / entry.totalArea : 0;
    }

    // Recharts shape: one row per season, columns per crop
    const yieldTrend = allSeasons.map((season) => {
        const row: Record<string, number | string> = { season };
        for (const crop of allCropTypes) {
            const entry = yieldTrendMap[crop]?.[season];
            row[`${crop}_kg`]      = entry?.totalKg    ?? 0;
            row[`${crop}_kgPerHa`] = entry?.yieldPerHa ?? 0;
            row[`${crop}_records`] = entry?.records    ?? 0;
        }
        return row;
    });

    // ── 2. Cost per hectare trend map ───────────────────────────────────────
    const costTrendMap: Record<string, Record<string, {
        totalCost:   number;
        totalArea:   number;
        costPerHa:   number;
        inputCost:   number;
        labourCost:  number;
        otherCost:   number;
        overhead:    number;
    }>> = {};

    for (const c of cropFieldStats) {
        if (!costTrendMap[c.cropName])
            costTrendMap[c.cropName] = {};

        if (!costTrendMap[c.cropName][c.season]) {
            costTrendMap[c.cropName][c.season] = {
                totalCost: 0, totalArea: 0, costPerHa: 0,
                inputCost: 0, labourCost: 0, otherCost: 0, overhead: 0,
            };
        }

        const entry = costTrendMap[c.cropName][c.season];
        entry.totalCost  += c.totalCost;
        entry.totalArea  += c.areaPlanted;
        entry.inputCost  += c.inputCost;
        entry.labourCost += c.labourCost;
        entry.otherCost  += c.otherCost;
        entry.overhead   += c.overhead;
        entry.costPerHa   = entry.totalArea > 0
            ? entry.totalCost / entry.totalArea : 0;
    }

    const costPerHaTrend = allSeasons.map((season) => {
        const row: Record<string, number | string> = { season };
        for (const crop of allCropTypes) {
            const entry = costTrendMap[crop]?.[season];
            row[`${crop}_costPerHa`]  = entry?.costPerHa  ?? 0;
            row[`${crop}_totalCost`]  = entry?.totalCost  ?? 0;
            row[`${crop}_inputCost`]  = entry?.inputCost  ?? 0;
            row[`${crop}_labourCost`] = entry?.labourCost ?? 0;
            row[`${crop}_overhead`]   = entry?.overhead   ?? 0;
        }
        return row;
    });

    // ── 3. Cost per kg trend ────────────────────────────────────────────────
    const costPerKgTrend = allSeasons.map((season) => {
        const row: Record<string, number | string> = { season };
        for (const crop of allCropTypes) {
            const yEntry = yieldTrendMap[crop]?.[season];
            const cEntry = costTrendMap[crop]?.[season];
            const kg     = yEntry?.totalKg   ?? 0;
            const cost   = cEntry?.totalCost ?? 0;
            row[`${crop}_costPerKg`] = kg > 0 ? cost / kg : 0;
        }
        return row;
    });

    // ── 4. Revenue vs expenses by season ────────────────────────────────────
    const revenueVsExpenses = allSeasons.map((season) => {
        const seasonCrops = cropFieldStats.filter((c) => c.season === season);
        const revenue     = seasonCrops.reduce((s, c) => s + c.revenue,    0);
        const expenses    = seasonCrops.reduce((s, c) => s + c.totalCost,  0);
        const inputCost   = seasonCrops.reduce((s, c) => s + c.inputCost,  0);
        const labourCost  = seasonCrops.reduce((s, c) => s + c.labourCost, 0);
        const otherCost   = seasonCrops.reduce((s, c) => s + c.otherCost,  0);
        const overhead    = seasonCrops.reduce((s, c) => s + c.overhead,   0);
        const area        = seasonCrops.reduce((s, c) => s + c.areaPlanted, 0);
        return {
            season,
            revenue,
            expenses,
            net: revenue - expenses,
            inputCost,
            labourCost,
            otherCost,
            overhead,
            area,
        };
    });

    // ── 5. Crop performance summary ─────────────────────────────────────────
    const cropPerformance = allCropTypes.map((cropName) => {
        const seasons = Object.entries(yieldTrendMap[cropName] ?? {})
            .filter(([, v]) => v.totalKg > 0)
            .map(([season, v]) => {
                const cost = costTrendMap[cropName]?.[season];
                return {
                    season,
                    yieldPerHa: v.yieldPerHa,
                    costPerHa:  cost?.costPerHa ?? 0,
                    costPerKg:  v.totalKg > 0
                        ? (cost?.totalCost ?? 0) / v.totalKg : 0,
                    totalKg:    v.totalKg,
                    totalArea:  v.totalArea,
                };
            })
            .sort((a, b) => a.season.localeCompare(b.season));

        if (seasons.length === 0) return null;

        const avgYieldPerHa = seasons.reduce(
            (s, x) => s + x.yieldPerHa, 0) / seasons.length;
        const avgCostPerHa  = seasons.reduce(
            (s, x) => s + x.costPerHa,  0) / seasons.length;
        const avgCostPerKg  = seasons.reduce(
            (s, x) => s + x.costPerKg,  0) / seasons.length;

        const bestSeason  = [...seasons]
            .sort((a, b) => b.yieldPerHa - a.yieldPerHa)[0];
        const worstSeason = [...seasons]
            .sort((a, b) => a.yieldPerHa - b.yieldPerHa)[0];

        // Trend: first vs last season
        let trend: "improving" | "declining" | "stable" = "stable";
        if (seasons.length >= 2) {
            const first = seasons[0].yieldPerHa;
            const last  = seasons[seasons.length - 1].yieldPerHa;
            const delta = ((last - first) / (first || 1)) * 100;
            if (delta >  5) trend = "improving";
            if (delta < -5) trend = "declining";
        }

        return {
            cropName,
            seasons,
            avgYieldPerHa,
            avgCostPerHa,
            avgCostPerKg,
            bestSeason,
            worstSeason,
            trend,
            totalSeasons: seasons.length,
        };
    }).filter(Boolean);

    // ── 6. Yield type map (for detail records) ──────────────────────────────
    const yieldTypeMap: Record<string, {
        records:         number;
        totalAreaPlanted: number;
        totalYieldKg:    number;
        totalCost:       number;
    }> = {};

    // ── 7. Yield detail records ─────────────────────────────────────────────
    // Iterate directly over allFields to keep TypeScript happy with crop.yields
    const yieldDetailRecords = allFields.flatMap((field) =>
        field.cropFields.map((crop) => {
            const totalYieldKg = crop.yields.reduce(
                (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0
            );

            const actCost = crop.activities.reduce((s, a) => {
                const ic = a.inputs.reduce(
                    (x, i) => x + i.totalCost, 0);
                const lc = a.labourRecords.reduce(
                    (x, l) => x + l.totalCost, 0);
                const oc = a.otherCosts.reduce(
                    (x, o) => x + o.amount, 0);
                return s + ic + lc + oc;
            }, 0);

            const totalCost = actCost + (overheadAllocation[crop.id] ?? 0);
            const name      = crop.cropType.name;

            if (!yieldTypeMap[name]) {
                yieldTypeMap[name] = {
                    records: 0, totalAreaPlanted: 0,
                    totalYieldKg: 0, totalCost: 0,
                };
            }
            yieldTypeMap[name].records          += crop.yields.length;
            yieldTypeMap[name].totalAreaPlanted  += crop.areaPlanted;
            yieldTypeMap[name].totalYieldKg      += totalYieldKg;
            yieldTypeMap[name].totalCost         += totalCost;

            return {
                cropFieldId:  crop.id,
                cropName:     name,
                variety:      crop.variety,
                fieldName:    field.name,
                season:       crop.season,
                status:       crop.status,
                areaPlanted:  crop.areaPlanted,
                totalYieldKg,
                totalCost,
                costPerKg:  totalYieldKg > 0
                    ? totalCost    / totalYieldKg  : 0,
                yieldPerHa: crop.areaPlanted > 0
                    ? totalYieldKg / crop.areaPlanted : 0,
            };
        })
    ).filter((r) => r.totalYieldKg > 0);

    // ── 8. Yield by type ────────────────────────────────────────────────────
    const yieldByType = Object.entries(yieldTypeMap)
        .map(([cropName, v]) => ({
            cropName,
            ...v,
            yieldPerHa: v.totalAreaPlanted > 0
                ? v.totalYieldKg / v.totalAreaPlanted : 0,
            costPerKg: v.totalYieldKg > 0
                ? v.totalCost    / v.totalYieldKg    : 0,
        }))
        .sort((a, b) => b.totalYieldKg - a.totalYieldKg);

    // ── 9. Break-even analysis ──────────────────────────────────────────────
    const breakEven = cropFieldStats.map((c) => ({
        cropName:             c.cropName,
        season:               c.season,
        fieldName:            c.fieldName,
        areaPlanted:          c.areaPlanted,
        totalCost:            c.totalCost,
        totalYieldKg:         c.totalYieldKg,
        revenue:              c.revenue,
        netProfit:            c.netProfit,
        costPerHa:            c.costPerHa,
        costPerKg:            c.costPerKg,
        yieldPerHa:           c.yieldPerHa,
        breakEvenPricePerKg:  c.totalYieldKg > 0
            ? c.totalCost / c.totalYieldKg : null,
        isProfitable:         c.netProfit > 0,
        profitMarginPct:      c.revenue > 0
            ? (c.netProfit / c.revenue) * 100 : null,
    })).sort((a, b) => b.season.localeCompare(a.season));

    // ── 10. Season summaries (for comparison tab) ───────────────────────────
    const seasonSummaries = allSeasons.map((season) => {
        const crops   = cropFieldStats.filter((c) => c.season === season);
        const totalKg = crops.reduce((s, c) => s + c.totalYieldKg, 0);
        const area    = crops.reduce((s, c) => s + c.areaPlanted,  0);
        return {
            season,
            cropCount:    crops.length,
            area,
            totalCost:    crops.reduce((s, c) => s + c.totalCost,  0),
            revenue:      crops.reduce((s, c) => s + c.revenue,    0),
            netProfit:    crops.reduce((s, c) => s + c.netProfit,  0),
            totalYieldKg: totalKg,
            yieldPerHa:   area > 0 ? totalKg / area : 0,
            costPerHa:    area > 0
                ? crops.reduce((s, c) => s + c.totalCost, 0) / area : 0,
            cropTypes: [...new Set(crops.map((c) => c.cropName))],
        };
    });

    return NextResponse.json({
        allSeasons,
        allCropTypes,
        yieldTrend,
        costPerHaTrend,
        costPerKgTrend,
        revenueVsExpenses,
        cropPerformance,
        breakEven,
        seasonSummaries,
        yieldsReport: {
            byType:  yieldByType,
            records: yieldDetailRecords,
        },
    });
}
