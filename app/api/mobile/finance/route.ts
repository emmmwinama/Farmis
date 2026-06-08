import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

function getSession(req: NextRequest) {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), JWT_SECRET) as {
            userId: string; farmId: string; email: string; role: string;
        };
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");
    const type   = searchParams.get("type");

    const transactions = await prisma.transaction.findMany({
        where: {
            farmId: session.farmId,
            ...(season ? { season } : {}),
            ...(type   ? { type }   : {}),
        },
        include: {
            field:     { select: { name: true } },
            cropField: { include: { cropType: true } },
        },
        orderBy: { date: "desc" },
    });

    const income  = transactions.filter((t) => t.type === "Income") .reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const byCategory: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
        if (!byCategory[t.category]) {
            byCategory[t.category] = { income: 0, expense: 0 };
        }
        if (t.type === "Income")  byCategory[t.category].income  += t.amount;
        if (t.type === "Expense") byCategory[t.category].expense += t.amount;
    }

    return NextResponse.json({
        transactions: transactions.map((t) => ({
            id:          t.id,
            type:        t.type,
            category:    t.category,
            amount:      t.amount,
            date:        t.date,
            description: t.description,
            season:      t.season,
            fieldName:   t.field?.name ?? null,
            cropName:    t.cropField?.cropType?.name ?? null,
        })),
        summary: {
            income,
            expense,
            net:        income - expense,
            byCategory: Object.entries(byCategory).map(([category, vals]) => ({
                category,
                income:  vals.income,
                expense: vals.expense,
                net:     vals.income - vals.expense,
            })),
        },
    });
}

export async function POST(req: NextRequest) {
    const session = getSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, category, amount, date, description, season, fieldId, cropFieldId } = body;

    if (!type || !category || !amount || !date || !description) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
        data: {
            farmId:      session.farmId,
            type,
            category,
            amount:      parseFloat(amount),
            date:        new Date(date),
            description,
            season:      season      ?? null,
            fieldId:     fieldId     ?? null,
            cropFieldId: cropFieldId ?? null,
        },
    });

    return NextResponse.json(transaction, { status: 201 });
}