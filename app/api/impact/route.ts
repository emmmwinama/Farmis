import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

function toKg(q: number, unit: string, uw: number | null) {
    if (unit === "kg") return q;
    if (unit === "tonnes") return q * 1000;
    if (uw) return q * uw;
    return q;
}

export async function GET() {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [fields, employees, transactions, overhead, inventory] = await Promise.all([
        prisma.field.findMany({
            where: { farmId: farm.id },
            include: {
                cropFields: {
                    include: {
                        cropType: true,
                        yields: true,
                        activities: {
                            include: { labourRecords: true, inputs: true, otherCosts: true },
                        },
                    },
                },
            },
        }),
        prisma.employee.findMany({ where: { farmId: farm.id } }),
        prisma.transaction.findMany({ where: { farmId: farm.id } }),
        prisma.overheadExpense.findMany({ where: { farmId: farm.id } }),
        prisma.inventoryItem.findMany({ where: { farmId: farm.id }, include: { sales: true } }),
    ]);

    const allCropFields = fields.flatMap((f) => f.cropFields);
    const allActivities = allCropFields.flatMap((cf) => cf.activities);
    const allYields = allCropFields.flatMap((cf) => cf.yields);
    const allSeasons = [...new Set(allCropFields.map((cf) => cf.season))];

    // Compute totals
    const totalArea = fields.reduce((s, f) => s + f.totalArea, 0);
    const totalYieldKg = allYields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);
    const totalIncome = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const totalSalesRevenue = inventory.reduce((s, i) => s + i.sales.reduce((ss, sale) => ss + sale.totalAmount, 0), 0);
    const totalRevenue = totalIncome + totalSalesRevenue;
    const totalActivityCost = allActivities.reduce((s, a) => {
        return s +
            a.labourRecords.reduce((ss, l) => ss + l.totalCost, 0) +
            a.inputs.reduce((ss, i) => ss + i.totalCost, 0) +
            a.otherCosts.reduce((ss, o) => ss + o.amount, 0);
    }, 0);
    const totalOverhead = overhead.reduce((s, o) => s + o.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);

    // Labour impact
    const totalLabourDays = allActivities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.daysWorked, 0);
    const totalLabourCost = allActivities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0);
    const uniqueWorkers = new Set(allActivities.flatMap((a) => a.labourRecords).map((l) => l.employeeId)).size;

    // Season performance
    const bySeasonMap: Record<string, {
        season: string; area: number; cost: number; yieldKg: number; crops: string[];
    }> = {};
    for (const cf of allCropFields) {
        if (!bySeasonMap[cf.season]) bySeasonMap[cf.season] = { season: cf.season, area: 0, cost: 0, yieldKg: 0, crops: [] };
        const cost = cf.activities.reduce((s, a) => {
            return s +
                a.labourRecords.reduce((ss, l) => ss + l.totalCost, 0) +
                a.inputs.reduce((ss, i) => ss + i.totalCost, 0) +
                a.otherCosts.reduce((ss, o) => ss + o.amount, 0);
        }, 0);
        const yieldKg = cf.yields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);
        bySeasonMap[cf.season].area += cf.areaPlanted;
        bySeasonMap[cf.season].cost += cost;
        bySeasonMap[cf.season].yieldKg += yieldKg;
        if (!bySeasonMap[cf.season].crops.includes(cf.cropType.name)) bySeasonMap[cf.season].crops.push(cf.cropType.name);
    }
    const seasonPerformance = Object.values(bySeasonMap).sort((a, b) => b.season.localeCompare(a.season));

    // Cost benchmarking vs ADMARC average
    const avgCostPerHa = totalArea > 0 ? totalActivityCost / totalArea : 0;
    const BENCHMARK_COST_PER_HA = 180000; // MWK — typical smallholder Malawi

    // Carbon estimate (rough: 2.5 tCO2e sequestered per ha of smallholder crop)
    const estimatedCarbonSequesteredTonnes = totalArea * 2.5;

    // Food security contribution (kg of food produced)
    const foodCrops = ["Maize", "Rice", "Beans", "Sweet Potato", "Cassava", "Groundnuts", "Soya"];
    const foodProducedKg = allCropFields
        .filter((cf) => foodCrops.some((fc) => cf.cropType.name.toLowerCase().includes(fc.toLowerCase())))
        .flatMap((cf) => cf.yields)
        .reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);

    // People fed estimate (1 person needs ~180kg maize equivalent per year)
    const peopleFedEstimate = Math.round(foodProducedKg / 180);

    // Revenue per hectare
    const revenuePerHa = totalArea > 0 ? totalRevenue / totalArea : 0;

    // SDG alignment
    const sdgImpacts = [
        { goal: "SDG 1", title: "No Poverty", metric: `MWK ${Math.round(totalRevenue).toLocaleString()} generated for farm household income`, icon: "🏘" },
        { goal: "SDG 2", title: "Zero Hunger", metric: `${Math.round(foodProducedKg).toLocaleString()} kg of food produced, feeding ~${peopleFedEstimate} people`, icon: "🌾" },
        { goal: "SDG 8", title: "Decent Work", metric: `${uniqueWorkers} workers employed, ${Math.round(totalLabourDays).toLocaleString()} labour days created`, icon: "💼" },
        { goal: "SDG 12", title: "Responsible Production", metric: `${totalArea.toFixed(1)} ha managed with digital record-keeping for traceability`, icon: "♻️" },
        { goal: "SDG 13", title: "Climate Action", metric: `~${estimatedCarbonSequesteredTonnes.toFixed(1)} tonnes CO₂ sequestered through crop production`, icon: "🌍" },
    ];

    return NextResponse.json({
        farmName: farm.name,
        ownerName: user.name,
        totalArea,
        totalFields: fields.length,
        totalSeasons: allSeasons.length,
        totalCrops: allCropFields.length,
        harvestedCrops: allCropFields.filter((cf) => cf.status === "Harvested").length,
        totalYieldKg,
        foodProducedKg,
        peopleFedEstimate,
        totalRevenue,
        totalCost: totalActivityCost + totalOverhead + totalExpense,
        netIncome: totalRevenue - totalActivityCost - totalOverhead - totalExpense,
        revenuePerHa,
        avgCostPerHa,
        benchmarkCostPerHa: BENCHMARK_COST_PER_HA,
        costVsBenchmark: avgCostPerHa > 0 ? Math.round(((avgCostPerHa - BENCHMARK_COST_PER_HA) / BENCHMARK_COST_PER_HA) * 100) : null,
        totalEmployees: employees.length,
        uniqueWorkers,
        totalLabourDays,
        totalLabourCost,
        totalActivities: allActivities.length,
        estimatedCarbonSequesteredTonnes,
        seasonPerformance,
        sdgImpacts,
        cropDiversity: [...new Set(allCropFields.map((cf) => cf.cropType.name))].length,
    });
}