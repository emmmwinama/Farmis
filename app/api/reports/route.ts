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
    const seasonFilter    = searchParams.get("season");
    const includeArchived = searchParams.get("includeArchived");
    const fieldIdFilter   = searchParams.get("fieldId");
    const cropFieldIdFilter = searchParams.get("cropFieldId");
    const fromFilter      = searchParams.get("from");
    const toFilter        = searchParams.get("to");
    const fromDate        = fromFilter ? new Date(fromFilter) : null;
    const toDate          = toFilter ? new Date(toFilter) : null;
    const hasDateFilter   = Boolean(fromDate || toDate);
    const dateWhere = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
    };
    const inDateRange = (date: Date) =>
        (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    // includeArchived=false → active only
    // includeArchived=true  → archived only
    // not set               → both

    // ── Step 1: Fetch ALL crops (no status filter) for overhead distribution
    //    The overhead pool must never change based on the display filter.
    const allFields = await prisma.field.findMany({
        where: { farmId: farm.id },
        include: {
            cropFields: {
                include: {
                    cropType:   true,
                    activities: {
                        include: {
                            inputs:        true,
                            labourRecords: { include: { employee: true } },
                            otherCosts:    true,
                        },
                    },
                    yields:       true,
                    transactions: true,
                },
            },
        },
    });

    const allCropFields = allFields.flatMap((f) =>
        f.cropFields.map((c) => ({ ...c, fieldName: f.name }))
    );

    // ── Step 2: Fetch overhead expenses ─────────────────────────────────────
    const overheadExpenses = await prisma.overheadExpense.findMany({
        where:   {
            farmId: farm.id,
            ...(hasDateFilter ? { date: dateWhere } : {}),
        },
        orderBy: { date: "asc" },
    });

    // ── Step 3: Distribute overhead using ALL crops (ignore display filter)
    //    Each crop gets a fixed overhead share that never changes.
    const overheadAllocation: Record<string, number> = {};
    let totalAllocated   = 0;
    let totalUnallocated = 0;

    for (const oh of overheadExpenses) {
        const expDate = new Date(oh.date);

        // ALL crops (active + archived) that were growing on this date
        const growingThen = allCropFields.filter((c) => {
            const planted   = new Date(c.plantingDate);
            const harvested = new Date(c.expectedHarvestDate);
            return planted <= expDate && harvested >= expDate;
        });

        const totalArea = growingThen.reduce((s, c) => s + c.areaPlanted, 0);

        if (totalArea === 0) {
            totalUnallocated += oh.amount;
            continue;
        }

        for (const c of growingThen) {
            const share = (c.areaPlanted / totalArea) * oh.amount;
            overheadAllocation[c.id] = (overheadAllocation[c.id] ?? 0) + share;
            totalAllocated           += share;
        }
    }

    const totalOverhead = overheadExpenses.reduce((s, o) => s + o.amount, 0);

    // ── Step 4: Now apply the display filter ────────────────────────────────
    const displayFilter = (c: { status: string; isArchived?: boolean }) =>
        includeArchived === "false" ? !c.isArchived && c.status !== "Archived" :
            includeArchived === "true"  ? Boolean(c.isArchived) || c.status === "Archived"  :
                true;

    const displayFields = allFields.map((f) => ({
        ...f,
        cropFields: f.cropFields.filter((c) => {
            if (fieldIdFilter && f.id !== fieldIdFilter) return false;
            if (cropFieldIdFilter && c.id !== cropFieldIdFilter) return false;
            if (!displayFilter(c))                         return false;
            if (seasonFilter && c.season !== seasonFilter) return false;
            return true;
        }),
    }));

    const displayCropFields = displayFields.flatMap((f) =>
        f.cropFields.map((c) => ({ ...c, fieldName: f.name }))
    );

    // ── Step 5: Calculate per-crop costs using FIXED overhead allocation ────
    const cropRows = displayCropFields.map((crop) => {
        const scopedActivities = hasDateFilter
            ? crop.activities.filter((activity) => inDateRange(activity.date))
            : crop.activities;
        const scopedYields = hasDateFilter
            ? crop.yields.filter((yieldRecord) => inDateRange(yieldRecord.harvestDate))
            : crop.yields;
        const scopedTransactions = hasDateFilter
            ? crop.transactions.filter((transaction) => inDateRange(transaction.date))
            : crop.transactions;

        const inputCost  = scopedActivities
            .flatMap((a) => a.inputs)
            .reduce((s, i) => s + i.totalCost, 0);

        const labourCost = scopedActivities
            .flatMap((a) => a.labourRecords)
            .reduce((s, l) => s + l.totalCost, 0);

        const otherCost  = scopedActivities
            .flatMap((a) => a.otherCosts)
            .reduce((s, o) => s + o.amount, 0);

        // Each crop's overhead is FIXED — same whether you filter Active or Both
        const allocatedOverhead = overheadAllocation[crop.id] ?? 0;
        const activityCost      = inputCost + labourCost + otherCost;
        const totalCost         = activityCost + allocatedOverhead;

        const totalYieldKg = scopedYields.reduce(
            (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0
        );

        const revenue = scopedTransactions
            .filter((t) => t.type === "Income")
            .reduce((s, t) => s + t.amount, 0);

        return {
            id:                  crop.id,
            isArchived:          crop.status === "Archived",
            status:              crop.status,
            cropTypeName:        crop.cropType.name,
            variety:             crop.variety,
            fieldName:           crop.fieldName,
            season:              crop.season,
            areaPlanted:         crop.areaPlanted,
            plantingDate:        crop.plantingDate,
            expectedHarvestDate: crop.expectedHarvestDate,
            activityCount:       scopedActivities.length,
            inputCost,
            labourCost,
            otherCost,
            activityCost,
            allocatedOverhead,
            totalCost,
            revenue,
            netProfit:   revenue - totalCost,
            totalYieldKg,
            yieldPerHa:  crop.areaPlanted > 0 ? totalYieldKg / crop.areaPlanted : 0,
            costPerKg:   totalYieldKg > 0      ? totalCost    / totalYieldKg     : 0,
        };
    });

    // ── Summary ──────────────────────────────────────────────────────────────
    const totalRevenue     = cropRows.reduce((s, c) => s + c.revenue,      0);
    const totalExpenses    = cropRows.reduce((s, c) => s + c.totalCost,    0);
    const totalKgHarvested = cropRows.reduce((s, c) => s + c.totalYieldKg, 0);
    const totalArea        = cropRows.reduce((s, c) => s + c.areaPlanted,  0);
    const avgYieldPerHa    = totalArea > 0 ? totalKgHarvested / totalArea : 0;

    // Overhead shown in summary = only what's allocated to DISPLAYED crops
    const displayedOverhead = cropRows.reduce(
        (s, c) => s + c.allocatedOverhead, 0
    );

    // By-season breakdown
    const seasonMap: Record<string, {
        cropCount:     number;
        archivedCount: number;
        area:          number;
        expenses:      number;
        revenue:       number;
    }> = {};

    for (const c of cropRows) {
        if (!seasonMap[c.season]) {
            seasonMap[c.season] = {
                cropCount: 0, archivedCount: 0,
                area: 0, expenses: 0, revenue: 0,
            };
        }
        seasonMap[c.season].cropCount  += 1;
        if (c.isArchived) seasonMap[c.season].archivedCount += 1;
        seasonMap[c.season].area     += c.areaPlanted;
        seasonMap[c.season].expenses += c.totalCost;
        seasonMap[c.season].revenue  += c.revenue;
    }

    const bySeasonBreakdown = Object.entries(seasonMap)
        .map(([season, v]) => ({ season, ...v }))
        .sort((a, b) => b.season.localeCompare(a.season));

    // ── Transactions ─────────────────────────────────────────────────────────
    const transactions = await prisma.transaction.findMany({
        where: {
            farmId: farm.id,
            ...(seasonFilter ? { season: seasonFilter } : {}),
            ...(fieldIdFilter ? { fieldId: fieldIdFilter } : {}),
            ...(cropFieldIdFilter ? { cropFieldId: cropFieldIdFilter } : {}),
            ...(hasDateFilter ? { date: dateWhere } : {}),
            ...(includeArchived === "false" ? { cropField: { isArchived: false } } : {}),
            ...(includeArchived === "true" ? { cropField: { isArchived: true } } : {}),
        },
        orderBy: { date: "desc" },
    });

    const totalTransactionIncome = transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);

    const cashflowByMonth = Object.values(transactions.reduce((acc, transaction) => {
        const month = transaction.date.toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = { month, income: 0, expenses: 0, net: 0 };
        if (transaction.type === "Income") acc[month].income += transaction.amount;
        else acc[month].expenses += transaction.amount;
        acc[month].net = acc[month].income - acc[month].expenses;
        return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number; net: number }>))
        .sort((a, b) => a.month.localeCompare(b.month));

    // Income by category
    const incomeMap: Record<string, number> = {};
    for (const t of transactions.filter((t) => t.type === "Income")) {
        incomeMap[t.category] = (incomeMap[t.category] ?? 0) + t.amount;
    }

    // Expense by category (activity costs + overhead)
    const expenseMap: Record<string, number> = {
        "Inputs (seeds, fertiliser, chemicals)": cropRows.reduce((s, c) => s + c.inputCost,  0),
        "Labour":                                cropRows.reduce((s, c) => s + c.labourCost, 0),
        "Other activity costs":                  cropRows.reduce((s, c) => s + c.otherCost,  0),
        "Overhead (allocated)":                  displayedOverhead,
    };

    const incomeByCategory   = Object.entries(incomeMap)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

    const expensesByCategory = Object.entries(expenseMap)
        .filter(([, v]) => v > 0)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

    // ── Yields ───────────────────────────────────────────────────────────────
    const yieldRecords = displayCropFields.flatMap((crop) =>
        crop.yields.filter((y) => !hasDateFilter || inDateRange(y.harvestDate)).map((y) => {
            const kg = toKg(y.quantity, y.unit, y.unitWeight);
            const u  = y.unit.toLowerCase();
            return {
                id:          y.id,
                cropName:    crop.cropType.name,
                fieldName:   crop.fieldName,
                season:      crop.season,
                harvestDate: y.harvestDate,
                displayQty:  `${y.quantity} ${y.unit}`,
                displayUnit: u.startsWith("bag")
                    ? `${y.unitWeight ?? 50} kg/bag`
                    : y.unit,
                kg,
                notes: y.notes,
            };
        })
    ).sort((a, b) =>
        new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
    );

    // ── Overhead allocation per displayed crop ───────────────────────────────
    const overheadPerCrop = cropRows
        .filter((c) => c.allocatedOverhead > 0)
        .map((c) => ({
            cropTypeName:      c.cropTypeName,
            fieldName:         c.fieldName,
            season:            c.season,
            areaPlanted:       c.areaPlanted,
            allocatedOverhead: c.allocatedOverhead,
        }))
        .sort((a, b) => b.allocatedOverhead - a.allocatedOverhead);

    const cropProfitabilityRanking = [...cropRows]
        .sort((a, b) => b.netProfit - a.netProfit)
        .map((crop) => ({
            cropName: crop.cropTypeName,
            variety: crop.variety,
            fieldName: crop.fieldName,
            season: crop.season,
            revenue: crop.revenue,
            totalCost: crop.totalCost,
            netProfit: crop.netProfit,
            margin: crop.revenue > 0 ? (crop.netProfit / crop.revenue) * 100 : 0,
        }));

    const fieldProfitabilityMap: Record<string, { fieldName: string; area: number; revenue: number; cost: number; netProfit: number }> = {};
    for (const crop of cropRows) {
        if (!fieldProfitabilityMap[crop.fieldName]) {
            fieldProfitabilityMap[crop.fieldName] = { fieldName: crop.fieldName, area: 0, revenue: 0, cost: 0, netProfit: 0 };
        }
        fieldProfitabilityMap[crop.fieldName].area += crop.areaPlanted;
        fieldProfitabilityMap[crop.fieldName].revenue += crop.revenue;
        fieldProfitabilityMap[crop.fieldName].cost += crop.totalCost;
        fieldProfitabilityMap[crop.fieldName].netProfit += crop.netProfit;
    }
    const fieldProfitabilityComparison = Object.values(fieldProfitabilityMap)
        .map((field) => ({
            ...field,
            profitPerHa: field.area > 0 ? field.netProfit / field.area : 0,
        }))
        .sort((a, b) => b.netProfit - a.netProfit);

    const inputEfficiencyReport = cropRows
        .map((crop) => ({
            cropName: crop.cropTypeName,
            variety: crop.variety,
            fieldName: crop.fieldName,
            season: crop.season,
            areaPlanted: crop.areaPlanted,
            totalYieldKg: crop.totalYieldKg,
            inputCost: crop.inputCost,
            costPerHa: crop.areaPlanted > 0 ? crop.inputCost / crop.areaPlanted : 0,
            costPerKg: crop.totalYieldKg > 0 ? crop.inputCost / crop.totalYieldKg : 0,
            yieldResponse: crop.inputCost > 0 ? crop.totalYieldKg / crop.inputCost : 0,
        }))
        .sort((a, b) => b.yieldResponse - a.yieldResponse);

    const animals = await prisma.animal.findMany({
        where: { farmId: farm.id },
        include: {
            livestockType: true,
            healthRecords: true,
            expenses: true,
            productions: true,
            sales: true,
        },
    });

    const livestockProfitabilityMap: Record<string, {
        type: string;
        count: number;
        sales: number;
        productionValue: number;
        expenses: number;
        healthCost: number;
        netProfit: number;
    }> = {};
    for (const animal of animals) {
        const type = animal.livestockType.name;
        if (!livestockProfitabilityMap[type]) {
            livestockProfitabilityMap[type] = { type, count: 0, sales: 0, productionValue: 0, expenses: 0, healthCost: 0, netProfit: 0 };
        }
        const row = livestockProfitabilityMap[type];
        const sales = animal.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const productionValue = animal.productions.reduce((sum, production) => sum + (production.totalValue ?? 0), 0);
        const expenses = animal.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const healthCost = animal.healthRecords.reduce((sum, health) => sum + health.cost, 0);
        row.count += 1;
        row.sales += sales;
        row.productionValue += productionValue;
        row.expenses += expenses;
        row.healthCost += healthCost;
        row.netProfit += sales + productionValue - expenses - healthCost - (animal.acquisitionCost ?? 0);
    }
    const livestockProfitability = Object.values(livestockProfitabilityMap)
        .sort((a, b) => b.netProfit - a.netProfit);

    return NextResponse.json({
        summary: {
            totalCrops:          cropRows.length,
            totalArea,
            totalKgHarvested,
            avgYieldPerHa,
            totalRevenue,
            totalExpenses,
            allocatedOverhead:   displayedOverhead,
            totalOverhead,
            unallocatedOverhead: totalUnallocated,
            bySeasonBreakdown,
        },
        crops:   cropRows,
        finance: {
            incomeByCategory,
            expensesByCategory,
            totalIncome:    totalTransactionIncome,
            totalExpenses,
            transactions,
            cashflowByMonth,
        },
        analytics: {
            cropProfitabilityRanking,
            fieldProfitabilityComparison,
            inputEfficiencyReport,
            livestockProfitability,
        },
        yields: yieldRecords,
        overheadAllocationSummary: {
            totalOverhead,
            totalAllocated,
            totalUnallocated,
            perCrop: overheadPerCrop,
        },
    });
}
