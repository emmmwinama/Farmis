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
                        yields: true,
                        activities: { include: { labourRecords: true, inputs: true, otherCosts: true } },
                    },
                },
            },
        }),
        prisma.employee.findMany({ where: { farmId: farm.id } }),
        prisma.transaction.findMany({ where: { farmId: farm.id }, orderBy: { date: "desc" } }),
        prisma.overheadExpense.findMany({ where: { farmId: farm.id } }),
        prisma.inventoryItem.findMany({ where: { farmId: farm.id }, include: { sales: true } }),
    ]);

    const allCropFields = fields.flatMap((f) => f.cropFields);
    const allYields = allCropFields.flatMap((cf) => cf.yields);
    const allSeasons = [...new Set(allCropFields.map((cf) => cf.season))];
    const income = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    const totalOverhead = overhead.reduce((s, o) => s + o.amount, 0);
    const totalRevenue = income + inventory.reduce((s, i) => s + i.sales.reduce((ss, sale) => ss + sale.totalAmount, 0), 0);
    const net = totalRevenue - expense - totalOverhead;
    const totalActivityCost = allCropFields.flatMap((cf) => cf.activities).reduce((s, a) => {
        return s +
            a.labourRecords.reduce((ss, l) => ss + l.totalCost, 0) +
            a.inputs.reduce((ss, i) => ss + i.totalCost, 0) +
            a.otherCosts.reduce((ss, o) => ss + o.amount, 0);
    }, 0);

    // ── Score calculation ──────────────────────────────────────────────────────
    const factors: Record<string, { score: number; max: number; label: string; detail: string }> = {};

    // 1. Record completeness (0-20 pts)
    let completeness = 0;
    if (fields.length > 0) completeness += 5;
    if (allCropFields.length > 0) completeness += 5;
    if (transactions.length >= 5) completeness += 5;
    else if (transactions.length > 0) completeness += 3;
    if (employees.length > 0) completeness += 3;
    if (allYields.length > 0) completeness += 2;
    factors.completeness = {
        score: completeness,
        max: 20,
        label: "Record completeness",
        detail: `${fields.length} fields, ${allCropFields.length} crop records, ${transactions.length} transactions, ${allYields.length} yield records`,
    };

    // 2. Financial health (0-25 pts)
    let financial = 0;
    if (totalRevenue > 0) financial += 5;
    if (net > 0) financial += 10;
    else if (net > -totalActivityCost * 0.2) financial += 4;
    const profitMargin = totalRevenue > 0 ? net / totalRevenue : 0;
    if (profitMargin > 0.3) financial += 10;
    else if (profitMargin > 0.15) financial += 7;
    else if (profitMargin > 0) financial += 3;
    factors.financial = {
        score: financial,
        max: 25,
        label: "Financial health",
        detail: `Revenue MWK ${Math.round(totalRevenue).toLocaleString()}, Net MWK ${Math.round(net).toLocaleString()}, Margin ${Math.round(profitMargin * 100)}%`,
    };

    // 3. Yield consistency (0-20 pts)
    let yieldScore = 0;
    const harvestedCrops = allCropFields.filter((cf) => cf.status === "Harvested" && cf.yields.length > 0);
    if (harvestedCrops.length >= 3) yieldScore += 10;
    else if (harvestedCrops.length >= 1) yieldScore += 6;
    if (allSeasons.length >= 2) yieldScore += 5;
    if (allSeasons.length >= 3) yieldScore += 5;
    factors.yield_consistency = {
        score: yieldScore,
        max: 20,
        label: "Yield consistency",
        detail: `${harvestedCrops.length} harvested crops across ${allSeasons.length} seasons`,
    };

    // 4. Operational activity (0-20 pts)
    let operational = 0;
    const totalActivities = allCropFields.flatMap((cf) => cf.activities).length;
    if (totalActivities >= 20) operational += 10;
    else if (totalActivities >= 10) operational += 7;
    else if (totalActivities >= 3) operational += 4;
    if (employees.length >= 3) operational += 5;
    else if (employees.length >= 1) operational += 3;
    const recentActivity = allCropFields.flatMap((cf) => cf.activities).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSinceActivity = recentActivity
        ? Math.floor((Date.now() - new Date(recentActivity.date).getTime()) / 86400000)
        : 999;
    if (daysSinceActivity < 30) operational += 5;
    else if (daysSinceActivity < 90) operational += 3;
    factors.operational = {
        score: operational,
        max: 20,
        label: "Operational activity",
        detail: `${totalActivities} farm activities, ${employees.length} employees, last activity ${daysSinceActivity < 999 ? daysSinceActivity + " days ago" : "not recorded"}`,
    };

    // 5. Scale & growth (0-15 pts)
    let scale = 0;
    const totalArea = fields.reduce((s, f) => s + f.totalArea, 0);
    if (totalArea >= 10) scale += 8;
    else if (totalArea >= 5) scale += 6;
    else if (totalArea >= 1) scale += 3;
    if (totalRevenue >= 5000000) scale += 7;
    else if (totalRevenue >= 1000000) scale += 5;
    else if (totalRevenue >= 500000) scale += 3;
    factors.scale = {
        score: scale,
        max: 15,
        label: "Scale & revenue",
        detail: `${totalArea.toFixed(1)} ha farmed, MWK ${Math.round(totalRevenue).toLocaleString()} total revenue`,
    };

    const totalScore = Object.values(factors).reduce((s, f) => s + f.score, 0);
    const maxScore = Object.values(factors).reduce((s, f) => s + f.max, 0);
    const score = Math.round((totalScore / maxScore) * 100);

    const grade =
        score >= 80 ? "A" :
            score >= 65 ? "B" :
                score >= 50 ? "C" :
                    score >= 35 ? "D" : "F";

    const gradeLabel =
        score >= 80 ? "Excellent — Strong loan candidate" :
            score >= 65 ? "Good — Meets most lender criteria" :
                score >= 50 ? "Fair — Some gaps to address" :
                    score >= 35 ? "Developing — Needs more records" :
                        "Early stage — Build your record first";

    const recommendations: string[] = [];
    if (factors.completeness.score < 15) recommendations.push("Add more transaction records and yield data to improve your score");
    if (factors.financial.score < 15) recommendations.push("Focus on increasing profitability — review your cost per hectare");
    if (factors.yield_consistency.score < 12) recommendations.push("Record harvests consistently across multiple seasons");
    if (factors.operational.score < 12) recommendations.push("Log more farm activities and ensure employee records are up to date");
    if (factors.scale.score < 10) recommendations.push("Expanding your farmed area or revenue base will strengthen your score");

    // Save score
    await prisma.farmCreditScore.create({
        data: {
            userId: user.id,
            farmId: farm.id,
            score,
            grade,
            factors,
            generatedAt: new Date(),
        },
    });

    return NextResponse.json({
        score,
        grade,
        gradeLabel,
        factors,
        recommendations,
        summary: {
            totalArea,
            totalRevenue,
            net,
            profitMargin: Math.round(profitMargin * 100),
            seasons: allSeasons.length,
            harvestedCrops: harvestedCrops.length,
            employees: employees.length,
            activities: totalActivities,
        },
        history: await prisma.farmCreditScore.findMany({
            where: { farmId: farm.id },
            orderBy: { generatedAt: "desc" },
            take: 6,
            select: { score: true, grade: true, generatedAt: true },
        }),
    });
}