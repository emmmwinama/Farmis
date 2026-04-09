import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

function toKg(quantity: number, unit: string, unitWeight: number | null): number {
    if (unit === "kg") return quantity;
    if (unit === "tonnes") return quantity * 1000;
    if (unitWeight) return quantity * unitWeight;
    return quantity;
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
        prisma.transaction.findMany({
            where: { farmId: farm.id },
            include: { field: true, cropField: { include: { cropType: true } } },
        }),
        prisma.overheadExpense.findMany({ where: { farmId: farm.id } }),
        prisma.inventoryItem.findMany({
            where: { farmId: farm.id },
            include: { sales: true },
        }),
    ]);

    const allCropFields = fields.flatMap((f) => f.cropFields);

    // Activity costs
    const activityCosts = allCropFields.flatMap((cf) =>
        cf.activities.map((a) => ({
            cost:
                a.labourRecords.reduce((s, l) => s + l.totalCost, 0) +
                a.inputs.reduce((s, i) => s + i.totalCost, 0) +
                a.otherCosts.reduce((s, o) => s + o.amount, 0),
            season: cf.season,
            cropName: cf.cropType.name,
        }))
    );

    // Finance aggregates
    const income = transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0);
    const totalActivityCost = activityCosts.reduce((s, a) => s + a.cost, 0);
    const totalOverhead = overhead.reduce((s, o) => s + o.amount, 0);

    // Yield totals
    const totalYieldKg = allCropFields.reduce(
        (s, cf) =>
            s + cf.yields.reduce((ys, y) => ys + toKg(y.quantity, y.unit, y.unitWeight), 0),
        0
    );

    // Inventory summary
    const totalInventoryItems = inventory.length;
    const inventoryRevenue = inventory.reduce(
        (s, i) => s + i.sales.reduce((ss, sale) => ss + sale.totalAmount, 0),
        0
    );

    // Season summary
    const seasonMap: Record <string,
        {
            totalArea: number;
            cropCount: number;
            crops: string[];
            activityCost: number;
            transactionIncome: number;
            transactionExpense: number;
        }
        > = {};

    for (const cf of allCropFields) {
        if (!seasonMap[cf.season]) {
            seasonMap[cf.season] = {
                totalArea: 0,
                cropCount: 0,
                crops: [],
                activityCost: 0,
                transactionIncome: 0,
                transactionExpense: 0,
            };
        }
        seasonMap[cf.season].totalArea += cf.areaPlanted;
        seasonMap[cf.season].cropCount += 1;
        if (!seasonMap[cf.season].crops.includes(cf.cropType.name)) {
            seasonMap[cf.season].crops.push(cf.cropType.name);
        }
        for (const a of cf.activities) {
            const cost =
                a.labourRecords.reduce((s, l) => s + l.totalCost, 0) +
                a.inputs.reduce((s, i) => s + i.totalCost, 0) +
                a.otherCosts.reduce((s, o) => s + o.amount, 0);
            seasonMap[cf.season].activityCost += cost;
        }
    }

    for (const t of transactions) {
        if (!t.season) continue;
        if (!seasonMap[t.season]) continue;
        if (t.type === "Income") seasonMap[t.season].transactionIncome += t.amount;
        else seasonMap[t.season].transactionExpense += t.amount;
    }

    const seasons = Object.entries(seasonMap)
        .map(([name, data]) => ({
            name,
            ...data,
            totalCost: data.activityCost + data.transactionExpense,
            netRevenue: data.transactionIncome - data.activityCost - data.transactionExpense,
        }))
        .sort((a, b) => b.name.localeCompare(a.name));

    // Crop summary
    const cropAggregates: Record <string,
        { name: string; totalArea: number; count: number; statuses: string[]; totalYieldKg: number }
        > = {};
    for (const cf of allCropFields) {
        const name = cf.cropType.name;
        if (!cropAggregates[name])
            cropAggregates[name] = { name, totalArea: 0, count: 0, statuses: [], totalYieldKg: 0 };
        cropAggregates[name].totalArea += cf.areaPlanted;
        cropAggregates[name].count += 1;
        cropAggregates[name].statuses.push(cf.status);
        cropAggregates[name].totalYieldKg += cf.yields.reduce(
            (s, y) => s + toKg(y.quantity, y.unit, y.unitWeight),
            0
        );
    }
    const cropSummary = Object.values(cropAggregates).sort((a, b) => b.totalArea - a.totalArea);

    // Field land use
    const fieldLandUse = fields.map((f) => ({
        name: f.name,
        cultivatableArea: f.cultivatableArea,
        allocated: f.cropFields
            .filter((c) => c.status === "Active")
            .reduce((s, c) => s + c.areaPlanted, 0),
    }));

    // Recent activities
    const recentActivities = await prisma.farmActivity.findMany({
        where: { fieldId: { in: fields.map((f) => f.id) } },
        include: { field: true, cropField: { include: { cropType: true } } },
        orderBy: { date: "desc" },
        take: 5,
    });

    return NextResponse.json({
        farmName: farm.name,
        userName: user.name,
        totalFields: fields.length,
        totalArea: fields.reduce((s, f) => s + f.totalArea, 0),
        activeCrops: allCropFields.filter((c) => c.status === "Active").length,
        harvestedCrops: allCropFields.filter((c) => c.status === "Harvested").length,
        activeEmployees: employees.filter((e) => e.isActive).length,
        totalEmployees: employees.length,
        totalYieldKg,
        totalInventoryItems,
        inventoryRevenue,
        income,
        expense,
        totalActivityCost,
        totalOverhead,
        net: income - totalActivityCost - totalOverhead - expense,
        fieldLandUse,
        cropSummary,
        seasons,
        recentActivities: recentActivities.map((a) => ({
            id: a.id,
            activityType: a.activityType,
            fieldName: a.field.name,
            cropName: a.cropField?.cropType?.name ?? null,
            date: a.date,
        })),
    });
}