import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

function toKg(q: number, unit: string, uw: number | null) {
    if (unit === "kg") return q;
    if (unit === "tonnes") return q * 1000;
    if (uw) return q * uw;
    return q;
}

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const seasonA = searchParams.get("a");
    const seasonB = searchParams.get("b");

    if (!seasonA || !seasonB) {
        return NextResponse.json({ error: "Two seasons required" }, { status: 400 });
    }

    async function getSeasonData(season: string) {
        const fields = await prisma.field.findMany({
            where: { farmId: farm.id },
            include: {
                cropFields: {
                    where: { season },
                    include: {
                        cropType: true,
                        yields: true,
                        activities: {
                            include: { labourRecords: true, inputs: true, otherCosts: true },
                        },
                    },
                },
            },
        });

        const cropFields = fields.flatMap((f) => f.cropFields);
        let labourCost = 0, inputCost = 0, otherCost = 0, totalYieldKg = 0;
        const cropTypes = new Set<string>();
        const fieldNames = new Set<string>();
        let totalArea = 0;

        for (const cf of cropFields) {
            cropTypes.add(cf.cropType.name);
            totalArea += cf.areaPlanted;
            for (const a of cf.activities) {
                labourCost += a.labourRecords.reduce((s, l) => s + l.totalCost, 0);
                inputCost  += a.inputs.reduce((s, i) => s + i.totalCost, 0);
                otherCost  += a.otherCosts.reduce((s, o) => s + o.amount, 0);
            }
            totalYieldKg += cf.yields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);
        }

        // @ts-ignore
        const transactions = await prisma.transaction.findMany({
            where: { farmId: farm.id, season },
        });
        const txIncome = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
        const txExpense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);

        const totalCost = labourCost + inputCost + otherCost + txExpense;
        const totalRevenue = txIncome;
        const grossProfit = totalRevenue - totalCost;
        const costPerHa = totalArea > 0 ? totalCost / totalArea : 0;
        const yieldPerHa = totalArea > 0 && totalYieldKg > 0 ? totalYieldKg / totalArea : 0;
        const costPerKg = totalYieldKg > 0 ? totalCost / totalYieldKg : null;

        return {
            season,
            crops: [...cropTypes],
            totalArea,
            cropCount: cropFields.length,
            labourCost,
            inputCost,
            otherCost,
            txExpense,
            totalCost,
            totalRevenue,
            grossProfit,
            costPerHa,
            yieldPerHa,
            totalYieldKg,
            costPerKg,
            activities: cropFields.flatMap((cf) => cf.activities).length,
        };
    }

    const [dataA, dataB] = await Promise.all([
        getSeasonData(seasonA),
        getSeasonData(seasonB),
    ]);

    const diff = (a: number, b: number) => ({
        value: a - b,
        pct: b !== 0 ? ((a - b) / Math.abs(b)) * 100 : null,
        improved: a < b,
    });

    return NextResponse.json({
        seasonA: dataA,
        seasonB: dataB,
        comparison: {
            totalCost:    diff(dataA.totalCost, dataB.totalCost),
            costPerHa:    diff(dataA.costPerHa, dataB.costPerHa),
            totalYieldKg: diff(dataA.totalYieldKg, dataB.totalYieldKg),
            yieldPerHa:   diff(dataA.yieldPerHa, dataB.yieldPerHa),
            grossProfit:  diff(dataA.grossProfit, dataB.grossProfit),
            costPerKg:    dataA.costPerKg && dataB.costPerKg ? diff(dataA.costPerKg, dataB.costPerKg) : null,
            activities:   diff(dataA.activities, dataB.activities),
        },
    });
}