import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { checkLimit } from "@/lib/subscription";

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const expenses = await prisma.overheadExpense.findMany({
        where:   { farmId: session.farmId },
        orderBy: { date: "desc" },
    });

    const total     = expenses.reduce((s, e) => s + e.amount, 0);
    const recurring = expenses
        .filter((e) => e.recurring)
        .reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
        expenses: expenses.map((e) => ({
            id:          e.id,
            description: e.description,
            category:    e.category,
            amount:      e.amount,
            date:        e.date,
            recurring:   e.recurring,
            notes:       e.notes,
        })),
        summary: { total, recurring },
    });
}

export async function POST(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(session.userId, "Transactions");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { description, category, amount, date, recurring, notes } = body;

    if (!description || !category || !amount || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await prisma.overheadExpense.create({
        data: {
            farmId:      session.farmId,
            description,
            category,
            amount:    parseFloat(amount),
            date:      new Date(date),
            recurring: recurring ?? false,
            notes:     notes ?? null,
        },
    });

    return NextResponse.json(expense, { status: 201 });
}
