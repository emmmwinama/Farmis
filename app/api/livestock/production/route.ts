import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const animalId = searchParams.get("animalId");
    const type     = searchParams.get("type");
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");

    const records = await prisma.animalProduction.findMany({
        where: {
            farmId: farm.id,
            ...(animalId ? { animalId } : {}),
            ...(type ? { type } : {}),
            ...(from || to ? {
                date: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to   ? { lte: new Date(to)   } : {}),
                },
            } : {}),
        },
        include: { animal: { include: { livestockType: true } } },
        orderBy: { date: "desc" },
    });

    // Aggregate by production type
    const byType: Record<string, { type: string; totalQty: number; totalValue: number; unit: string; count: number }> = {};
    for (const r of records) {
        if (!byType[r.type]) byType[r.type] = { type: r.type, totalQty: 0, totalValue: 0, unit: r.unit, count: 0 };
        byType[r.type].totalQty   += r.quantity;
        byType[r.type].totalValue += r.totalValue ?? 0;
        byType[r.type].count++;
    }

    // Daily totals for charting (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recent = records.filter((r) => r.date >= thirtyDaysAgo);
    const byDay: Record<string, number> = {};
    for (const r of recent) {
        const key = new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        if (!byDay[key]) byDay[key] = 0;
        byDay[key] += r.quantity;
    }

    return NextResponse.json({
        records,
        byType: Object.values(byType),
        byDay: Object.entries(byDay).map(([date, qty]) => ({ date, qty })).reverse(),
        totalRevenue: records.reduce((s, r) => s + (r.totalValue ?? 0), 0),
        allTypes: [...new Set(records.map((r) => r.type))],
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { animalId, type, quantity, unit, date, pricePerUnit, notes } = body;

    if (!type || !quantity || !unit || !date) {
        return NextResponse.json({ error: "Type, quantity, unit and date are required" }, { status: 400 });
    }

    const totalValue = pricePerUnit ? parseFloat(quantity) * parseFloat(pricePerUnit) : null;

    const record = await prisma.animalProduction.create({
        data: {
            farmId:       farm.id,
            animalId:     animalId || null,
            type,
            quantity:     parseFloat(quantity),
            unit,
            date:         new Date(date),
            pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
            totalValue,
            notes:        notes || null,
        },
    });

    // If priced, auto-create inventory/income record
    if (totalValue && totalValue > 0) {
        await prisma.transaction.create({
            data: {
                farmId:      farm.id,
                type:        "Income",
                category:    "Livestock sales",
                amount:      totalValue,
                date:        new Date(date),
                description: `${type} production — ${parseFloat(quantity)} ${unit}`,
            },
        });
    }

    return NextResponse.json(record, { status: 201 });
}