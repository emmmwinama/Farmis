import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const expenses = await prisma.overheadExpense.findMany({
        where: { farmId: farm.id },
        orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { description, category, amount, date, recurring, notes } = body;

    if (!description || !category || !amount || !date) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const expense = await prisma.overheadExpense.create({
        data: {
            farmId: farm.id,
            description,
            category,
            amount: parseFloat(amount),
            date: new Date(date),
            recurring: recurring ?? false,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(expense, { status: 201 });
}