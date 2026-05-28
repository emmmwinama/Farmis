import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [animals, expenses, productions, sales, healthRecords] = await Promise.all([
        prisma.animal.findMany({
            where: { farmId: farm.id },
            include: { livestockType: true },
        }),
        prisma.animalExpense.findMany({ where: { farmId: farm.id } }),
        prisma.animalProduction.findMany({ where: { farmId: farm.id } }),
        prisma.animalSale.findMany({ where: { farmId: farm.id } }),
        prisma.animalHealth.findMany({
            where: { farmId: farm.id },
            orderBy: { nextDueDate: "asc" },
        }),
    ]);

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);

    const totalExpenses   = expenses.reduce((s, e) => s + e.amount, 0) +
        animals.reduce((s, a) => s + (a.acquisitionCost ?? 0), 0);
    const totalRevenue    = sales.reduce((s, s2) => s + s2.totalAmount, 0);
    const totalProduction = productions.reduce((s, p) => s + (p.totalValue ?? 0), 0);
    const netValue        = totalRevenue + totalProduction - totalExpenses;

    const byType: Record<string, { name: string; icon: string; count: number; active: number }> = {};
    for (const a of animals) {
        const k = a.livestockType.name;
        if (!byType[k]) byType[k] = { name: k, icon: a.livestockType.icon, count: 0, active: 0 };
        byType[k].count++;
        if (a.status === "Active") byType[k].active++;
    }

    const upcomingHealth = healthRecords.filter(
        (h) => h.nextDueDate && h.nextDueDate >= now && h.nextDueDate <= soon
    );

    // Monthly expense trend (last 6 months)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
    const recentExpenses = expenses.filter((e) => e.date >= sixMonthsAgo);
    const expenseByMonth: Record<string, number> = {};
    for (const e of recentExpenses) {
        const key = new Date(e.date).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
        if (!expenseByMonth[key]) expenseByMonth[key] = 0;
        expenseByMonth[key] += e.amount;
    }

    return NextResponse.json({
        totals: {
            total:    animals.length,
            active:   animals.filter((a) => a.status === "Active").length,
            sold:     animals.filter((a) => a.status === "Sold").length,
            deceased: animals.filter((a) => a.status === "Deceased").length,
        },
        financial: {
            totalExpenses,
            totalRevenue,
            totalProduction,
            netValue,
        },
        byType: Object.values(byType),
        upcomingHealth,
        upcomingHealthCount: upcomingHealth.length,
        expenseByMonth: Object.entries(expenseByMonth).map(([month, total]) => ({ month, total })),
        recentSales: sales.slice(0, 5),
        productionByType: (() => {
            const m: Record<string, { type: string; qty: number; value: number }> = {};
            for (const p of productions) {
                if (!m[p.type]) m[p.type] = { type: p.type, qty: 0, value: 0 };
                m[p.type].qty += p.quantity;
                m[p.type].value += p.totalValue ?? 0;
            }
            return Object.values(m);
        })(),
    });
}