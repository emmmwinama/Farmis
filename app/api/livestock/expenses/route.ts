import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const animalId = searchParams.get("animalId");

    const expenses = await prisma.animalExpense.findMany({
        where: {
            farmId: farm.id,
            ...(animalId ? { animalId } : {}),
        },
        include: { animal: { include: { livestockType: true } } },
        orderBy: { date: "desc" },
    });

    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
        if (!byCategory[e.category]) byCategory[e.category] = 0;
        byCategory[e.category] += e.amount;
    }

    return NextResponse.json({
        expenses,
        byCategory: Object.entries(byCategory).map(([cat, total]) => ({ category: cat, total })).sort((a, b) => b.total - a.total),
        total: expenses.reduce((s, e) => s + e.amount, 0),
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { animalId, category, description, amount, date, notes } = body;

    if (!category || !description || !amount || !date) {
        return NextResponse.json({ error: "Category, description, amount and date are required" }, { status: 400 });
    }

    const expense = await prisma.animalExpense.create({
        data: {
            farmId:      farm.id,
            animalId:    animalId || null,
            category,
            description,
            amount:      parseFloat(amount),
            date:        new Date(date),
            notes:       notes || null,
        },
    });

    return NextResponse.json(expense, { status: 201 });
}