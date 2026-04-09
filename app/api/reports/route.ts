import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

function toKg(quantity: number, unit: string, unitWeight: number | null): number {
    if (unit === "kg") return quantity;
    if (unit === "tonnes") return quantity * 1000;
    if (unitWeight) return quantity * unitWeight;
    return quantity;
}

function getCropFieldCosts(cropField: any) {
    let labour = 0, inputs = 0, other = 0;
    for (const a of cropField.activities) {
        labour += a.labourRecords.reduce((s: number, l: any) => s + l.totalCost, 0);
        inputs += a.inputs.reduce((s: number, i: any) => s + i.totalCost, 0);
        other += a.otherCosts.reduce((s: number, o: any) => s + o.amount, 0);
    }
    return { labour, inputs, other, total: labour + inputs + other };
}

function getCropFieldYieldKg(cropField: any): number {
    return cropField.yields.reduce(
        (s: number, y: any) => s + toKg(y.quantity, y.unit, y.unitWeight),
        0
    );
}

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [fields, transactions, overheadExpenses, inventoryItems] = await Promise.all([
        prisma.field.findMany({
            where: { farmId: farm.id },
            include: {
                cropFields: {
                    include: {
                        cropType: true,
                        yields: true,
                        activities: {
                            include: {
                                labourRecords: { include: { employee: true } },
                                inputs: true,
                                otherCosts: true,
                            },
                        },
                        inventoryItems: {
                            include: {
                                sales: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.transaction.findMany({
            where: { farmId: farm.id },
            include: {
                field: true,
                cropField: { include: { cropType: true } },
            },
            orderBy: { date: "desc" },
        }),
        prisma.overheadExpense.findMany({
            where: { farmId: farm.id },
            orderBy: { date: "desc" },
        }),
        prisma.inventoryItem.findMany({
            where: { farmId: farm.id },
            include: {
                sales: true,
                cropField: { include: { cropType: true, field: true } },
            },
        }),
    ]);

    // Helper: get transaction income for a season
    function getSeasonTransactionIncome(season: string) {
        return transactions
            .filter((t) => t.season === season && t.type === "Income")
            .reduce((s, t) => s + t.amount, 0);
    }

    function getSeasonTransactionExpense(season: string) {
        return transactions
            .filter((t) => t.season === season && t.type === "Expense")
            .reduce((s, t) => s + t.amount, 0);
    }

    // Helper: get transaction income for a cropField
    function getCropFieldTransactionIncome(cropFieldId: string) {
        return transactions
            .filter((t) => t.cropFieldId === cropFieldId && t.type === "Income")
            .reduce((s, t) => s + t.amount, 0);
    }

    function getCropFieldTransactionExpense(cropFieldId: string) {
        return transactions
            .filter((t) => t.cropFieldId === cropFieldId && t.type === "Expense")
            .reduce((s, t) => s + t.amount, 0);
    }

    // Inventory sales revenue per cropField
    function getCropFieldInventoryRevenue(cropFieldId: string) {
        return inventoryItems
            .filter((i) => i.cropFieldId === cropFieldId)
            .reduce((s, i) => s + i.sales.reduce((ss, sale) => ss + sale.totalAmount, 0), 0);
    }

    // ── Season report ──────────────────────────────────────────────────────────
    const seasonMap: Record<string, any> = {};

    for (const field of fields) {
        for (const cf of field.cropFields) {
            const costs = getCropFieldCosts(cf);
            const yieldKg = getCropFieldYieldKg(cf);

            if (!seasonMap[cf.season]) {
                seasonMap[cf.season] = {
                    season: cf.season,
                    totalArea: 0,
                    totalActivityCost: 0,
                    labourCost: 0,
                    inputCost: 0,
                    otherCost: 0,
                    totalYieldKg: 0,
                    cropCount: 0,
                    crops: [],
                    fields: [],
                    transactionIncome: 0,
                    transactionExpense: 0,
                    inventoryRevenue: 0,
                };
            }

            seasonMap[cf.season].totalArea += cf.areaPlanted;
            seasonMap[cf.season].totalActivityCost += costs.total;
            seasonMap[cf.season].labourCost += costs.labour;
            seasonMap[cf.season].inputCost += costs.inputs;
            seasonMap[cf.season].otherCost += costs.other;
            seasonMap[cf.season].totalYieldKg += yieldKg;
            seasonMap[cf.season].cropCount += 1;
            seasonMap[cf.season].inventoryRevenue += getCropFieldInventoryRevenue(cf.id);

            if (!seasonMap[cf.season].crops.includes(cf.cropType.name))
                seasonMap[cf.season].crops.push(cf.cropType.name);
            if (!seasonMap[cf.season].fields.includes(field.name))
                seasonMap[cf.season].fields.push(field.name);
        }
    }

    // Add season-level transactions
    for (const [season, data] of Object.entries(seasonMap)) {
        data.transactionIncome = getSeasonTransactionIncome(season);
        data.transactionExpense = getSeasonTransactionExpense(season);
    }

    const seasonReport = Object.values(seasonMap).map((s: any) => {
        const totalRevenue = s.transactionIncome + s.inventoryRevenue;
        const totalCost = s.totalActivityCost + s.transactionExpense;
        return {
            ...s,
            totalRevenue,
            totalCost,
            grossProfit: totalRevenue - totalCost,
            costPerHectare: s.totalArea > 0 ? totalCost / s.totalArea : 0,
            yieldPerHectare: s.totalArea > 0 && s.totalYieldKg > 0 ? s.totalYieldKg / s.totalArea : 0,
            costPerKg: s.totalYieldKg > 0 ? totalCost / s.totalYieldKg : null,
            revenuePerKg: s.totalYieldKg > 0 ? totalRevenue / s.totalYieldKg : null,
        };
    }).sort((a: any, b: any) => b.season.localeCompare(a.season));

    // ── Crop type report ───────────────────────────────────────────────────────
    const cropMap: Record<string, any> = {};

    for (const field of fields) {
        for (const cf of field.cropFields) {
            const costs = getCropFieldCosts(cf);
            const yieldKg = getCropFieldYieldKg(cf);
            const txIncome = getCropFieldTransactionIncome(cf.id);
            const txExpense = getCropFieldTransactionExpense(cf.id);
            const invRevenue = getCropFieldInventoryRevenue(cf.id);
            const name = cf.cropType.name;

            if (!cropMap[name]) {
                cropMap[name] = {
                    cropName: name,
                    totalArea: 0,
                    totalActivityCost: 0,
                    labourCost: 0,
                    inputCost: 0,
                    otherCost: 0,
                    totalYieldKg: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    count: 0,
                    seasons: [],
                    fields: [],
                };
            }

            cropMap[name].totalArea += cf.areaPlanted;
            cropMap[name].totalActivityCost += costs.total;
            cropMap[name].labourCost += costs.labour;
            cropMap[name].inputCost += costs.inputs;
            cropMap[name].otherCost += costs.other;
            cropMap[name].totalYieldKg += yieldKg;
            cropMap[name].totalRevenue += txIncome + invRevenue;
            cropMap[name].totalCost += costs.total + txExpense;
            cropMap[name].count += 1;

            if (!cropMap[name].seasons.includes(cf.season)) cropMap[name].seasons.push(cf.season);
            if (!cropMap[name].fields.includes(field.name)) cropMap[name].fields.push(field.name);
        }
    }

    const cropReport = Object.values(cropMap).map((c: any) => ({
        ...c,
        grossProfit: c.totalRevenue - c.totalCost,
        costPerHectare: c.totalArea > 0 ? c.totalCost / c.totalArea : 0,
        yieldPerHectare: c.totalArea > 0 && c.totalYieldKg > 0 ? c.totalYieldKg / c.totalArea : 0,
        costPerKg: c.totalYieldKg > 0 ? c.totalCost / c.totalYieldKg : null,
        revenuePerKg: c.totalYieldKg > 0 ? c.totalRevenue / c.totalYieldKg : null,
    })).sort((a: any, b: any) => b.totalArea - a.totalArea);

    // ── Field report ───────────────────────────────────────────────────────────
    const fieldReport = fields.map((field) => {
        let totalActivityCost = 0, labourCost = 0, inputCost = 0, otherCost = 0;
        let totalYieldKg = 0, totalRevenue = 0, totalCost = 0;
        const seasons: string[] = [], crops: string[] = [];

        for (const cf of field.cropFields) {
            const costs = getCropFieldCosts(cf);
            const yieldKg = getCropFieldYieldKg(cf);
            const txIncome = getCropFieldTransactionIncome(cf.id);
            const txExpense = getCropFieldTransactionExpense(cf.id);
            const invRevenue = getCropFieldInventoryRevenue(cf.id);

            totalActivityCost += costs.total;
            labourCost += costs.labour;
            inputCost += costs.inputs;
            otherCost += costs.other;
            totalYieldKg += yieldKg;
            totalRevenue += txIncome + invRevenue;
            totalCost += costs.total + txExpense;

            if (!seasons.includes(cf.season)) seasons.push(cf.season);
            if (!crops.includes(cf.cropType.name)) crops.push(cf.cropType.name);
        }

        const fieldTransactionIncome = transactions
            .filter((t) => t.fieldId === field.id && t.type === "Income")
            .reduce((s, t) => s + t.amount, 0);
        const fieldTransactionExpense = transactions
            .filter((t) => t.fieldId === field.id && t.type === "Expense")
            .reduce((s, t) => s + t.amount, 0);

        totalRevenue += fieldTransactionIncome;
        totalCost += fieldTransactionExpense;

        const totalAreaPlanted = field.cropFields.reduce((s, cf) => s + cf.areaPlanted, 0);

        return {
            fieldId: field.id,
            fieldName: field.name,
            totalArea: field.totalArea,
            cultivatableArea: field.cultivatableArea,
            totalAreaPlanted,
            soilType: field.soilType,
            totalActivityCost,
            labourCost,
            inputCost,
            otherCost,
            totalYieldKg,
            totalRevenue,
            totalCost,
            grossProfit: totalRevenue - totalCost,
            costPerHectare: totalAreaPlanted > 0 ? totalCost / totalAreaPlanted : 0,
            yieldPerHectare: totalAreaPlanted > 0 && totalYieldKg > 0 ? totalYieldKg / totalAreaPlanted : 0,
            costPerKg: totalYieldKg > 0 ? totalCost / totalYieldKg : null,
            seasons,
            crops,
            cropCount: field.cropFields.length,
        };
    }).sort((a, b) => b.totalCost - a.totalCost);

    // ── Crop-field detail ──────────────────────────────────────────────────────
    const cropFieldDetail = fields.flatMap((field) =>
        field.cropFields.map((cf) => {
            const costs = getCropFieldCosts(cf);
            const totalYieldKg = getCropFieldYieldKg(cf);
            const txIncome = getCropFieldTransactionIncome(cf.id);
            const txExpense = getCropFieldTransactionExpense(cf.id);
            const invRevenue = getCropFieldInventoryRevenue(cf.id);
            const totalRevenue = txIncome + invRevenue;
            const totalCost = costs.total + txExpense;

            const inventoryForThisCrop = inventoryItems.filter((i) => i.cropFieldId === cf.id);
            const totalSoldKg = inventoryForThisCrop.reduce(
                (s, i) => s + i.sales.reduce((ss, sale) => ss + toKg(sale.quantitySold, sale.unit, i.unitWeight), 0),
                0
            );
            const remainingInventoryKg = totalYieldKg - totalSoldKg;

            return {
                id: cf.id,
                cropName: cf.cropType.name,
                variety: cf.variety,
                fieldName: field.name,
                season: cf.season,
                areaPlanted: cf.areaPlanted,
                status: cf.status,
                plantingDate: cf.plantingDate,
                expectedHarvestDate: cf.expectedHarvestDate,
                activityCount: cf.activities.length,
                yieldCount: cf.yields.length,
                totalYieldKg,
                totalYieldBags50: totalYieldKg / 50,
                totalYieldTonnes: totalYieldKg / 1000,
                totalSoldKg,
                remainingInventoryKg: Math.max(0, remainingInventoryKg),
                ...costs,
                totalCost,
                totalRevenue,
                grossProfit: totalRevenue - totalCost,
                costPerHectare: cf.areaPlanted > 0 ? totalCost / cf.areaPlanted : 0,
                revenuePerHectare: cf.areaPlanted > 0 ? totalRevenue / cf.areaPlanted : 0,
                yieldPerHectare:
                    cf.areaPlanted > 0 && totalYieldKg > 0 ? totalYieldKg / cf.areaPlanted : 0,
                costPerKg: totalYieldKg > 0 ? totalCost / totalYieldKg : null,
                costPerBag50: totalYieldKg > 0 ? (totalCost / totalYieldKg) * 50 : null,
                costPerTonne: totalYieldKg > 0 ? (totalCost / totalYieldKg) * 1000 : null,
                revenuePerKg: totalYieldKg > 0 ? totalRevenue / totalYieldKg : null,
                inputs: cf.activities.flatMap((a) => a.inputs).reduce((acc: any[], inp) => {
                    const existing = acc.find((x) => x.inputName === inp.inputName);
                    if (existing) {
                        existing.quantity += inp.quantity;
                        existing.totalCost += inp.totalCost;
                    } else {
                        acc.push({
                            inputName: inp.inputName,
                            category: inp.category,
                            quantity: inp.quantity,
                            unit: inp.unit,
                            totalCost: inp.totalCost,
                        });
                    }
                    return acc;
                }, []),
            };
        })
    );

    // ── Employee report ────────────────────────────────────────────────────────
    const employeeMap: Record<string, any> = {};
    for (const field of fields) {
        for (const cf of field.cropFields) {
            for (const a of cf.activities) {
                for (const l of a.labourRecords) {
                    const id = l.employee.id;
                    if (!employeeMap[id]) {
                        employeeMap[id] = {
                            employeeId: id,
                            name: l.employee.name,
                            role: l.employee.role,
                            totalDays: 0,
                            totalHours: 0,
                            totalEarned: 0,
                            activities: 0,
                        };
                    }
                    employeeMap[id].totalDays += l.daysWorked;
                    employeeMap[id].totalHours += l.hoursWorked;
                    employeeMap[id].totalEarned += l.totalCost;
                    employeeMap[id].activities += 1;
                }
            }
        }
    }
    const employeeReport = Object.values(employeeMap).sort(
        (a, b) => b.totalEarned - a.totalEarned
    );

    // ── Input report ───────────────────────────────────────────────────────────
    const inputMap: Record<string, any> = {};
    for (const field of fields) {
        for (const cf of field.cropFields) {
            for (const a of cf.activities) {
                for (const inp of a.inputs) {
                    const key = inp.inputName;
                    if (!inputMap[key]) {
                        inputMap[key] = {
                            inputName: inp.inputName,
                            category: inp.category,
                            unit: inp.unit,
                            totalQuantity: 0,
                            totalCost: 0,
                            usageCount: 0,
                        };
                    }
                    inputMap[key].totalQuantity += inp.quantity;
                    inputMap[key].totalCost += inp.totalCost;
                    inputMap[key].usageCount += 1;
                }
            }
        }
    }
    const inputReport = Object.values(inputMap).sort((a, b) => b.totalCost - a.totalCost);

    // ── Inventory report ───────────────────────────────────────────────────────
    const inventoryReport = inventoryItems.map((item) => {
        const totalSold = item.sales.reduce((s, sale) => s + sale.quantitySold, 0);
        const totalRevenue = item.sales.reduce((s, sale) => s + sale.totalAmount, 0);
        const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
        return {
            id: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: item.quantity,
            totalSold,
            totalRevenue,
            avgPricePerUnit: avgPrice,
            cropName: item.cropField?.cropType?.name ?? null,
            fieldName: item.cropField?.field?.name ?? null,
            season: item.season,
        };
    });

    // ── Finance summary ────────────────────────────────────────────────────────
    const totalIncome = transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);
    const totalExpenseFromTransactions = transactions
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0);
    const totalActivityCost = cropFieldDetail.reduce((s, cf) => s + (cf as any).total, 0);
    const totalOverheadCost = overheadExpenses.reduce((s, o) => s + o.amount, 0);
    const totalInventoryRevenue = inventoryItems.reduce(
        (s, i) => s + i.sales.reduce((ss, sale) => ss + sale.totalAmount, 0),
        0
    );
    const totalCost = totalActivityCost + totalOverheadCost + totalExpenseFromTransactions;
    const totalRevenue = totalIncome + totalInventoryRevenue;

    return NextResponse.json({
        seasonReport,
        cropReport,
        fieldReport,
        cropFieldDetail,
        employeeReport,
        inputReport,
        inventoryReport,
        overheadExpenses,
        financeSummary: {
            totalIncome,
            totalInventoryRevenue,
            totalRevenue,
            totalActivityCost,
            totalOverheadCost,
            totalExpenseFromTransactions,
            totalCost,
            grossProfit: totalRevenue - totalCost,
        },
    });
}