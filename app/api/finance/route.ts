import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";

const CROP_SALE_CATEGORIES = [
    "Crop sales",
    "Produce sales",
    "Harvest sales",
    "Livestock sales",
];

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const season = searchParams.get("season");
    const fieldId = searchParams.get("fieldId");
    const cropFieldId = searchParams.get("cropFieldId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const transactions = await prisma.transaction.findMany({
        where: {
            farmId: farm.id,
            ...(type ? { type } : {}),
            ...(season ? { season } : {}),
            ...(fieldId ? { fieldId } : {}),
            ...(cropFieldId ? { cropFieldId } : {}),
            ...(from || to
                ? {
                    date: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(to) } : {}),
                    },
                }
                : {}),
        },
        include: {
            field: true,
            cropField: { include: { cropType: true } },
            harvestYield: true,
        },
        orderBy: { date: "desc" },
    });

    // Aggregate income and expense
    const income = transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);

    const expense = transactions
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0);

    // By category
    const byCategoryMap: Record<string, { type: string; total: number; count: number }> = {};
    for (const t of transactions) {
        if (!byCategoryMap[t.category])
            byCategoryMap[t.category] = { type: t.type, total: 0, count: 0 };
        byCategoryMap[t.category].total += t.amount;
        byCategoryMap[t.category].count += 1;
    }

    // By month
    const byMonthMap: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
        const key = new Date(t.date).toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
        });
        if (!byMonthMap[key]) byMonthMap[key] = { income: 0, expense: 0 };
        if (t.type === "Income") byMonthMap[key].income += t.amount;
        else byMonthMap[key].expense += t.amount;
    }

    // By season
    const bySeasonMap: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
        const key = t.season ?? "General";
        if (!bySeasonMap[key]) bySeasonMap[key] = { income: 0, expense: 0 };
        if (t.type === "Income") bySeasonMap[key].income += t.amount;
        else bySeasonMap[key].expense += t.amount;
    }

    // All seasons for filter (from crop fields)
    const allSeasonRecords = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "desc" },
    });

    // All fields for filter
    const allFields = await prisma.field.findMany({
        where: { farmId: farm.id },
        select: { id: true, name: true },
    });

    // All crop fields for filter (with season info)
    const allCropFields = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        include: { cropType: true, field: true },
        orderBy: { season: "desc" },
    });

    return NextResponse.json({
        transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            category: t.category,
            amount: t.amount,
            date: t.date,
            description: t.description,
            season: t.season,
            fieldId: t.fieldId,
            fieldName: t.field?.name ?? null,
            cropFieldId: t.cropFieldId,
            cropName: t.cropField?.cropType?.name ?? null,
            cropVariety: t.cropField?.variety ?? null,
            harvestYieldId: t.harvestYieldId,
            isCropSale: CROP_SALE_CATEGORIES.includes(t.category),
        })),
        income,
        expense,
        net: income - expense,
        byCategory: Object.entries(byCategoryMap)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.total - a.total),
        byMonth: Object.entries(byMonthMap)
            .map(([month, data]) => ({ month, ...data }))
            .reverse(),
        bySeason: Object.entries(bySeasonMap)
            .map(([season, data]) => ({ season, net: data.income - data.expense, ...data }))
            .sort((a, b) => b.season.localeCompare(a.season)),
        allSeasons: allSeasonRecords.map((s) => s.season),
        allFields,
        allCropFields: allCropFields.map((c) => ({
            id: c.id,
            label: `${c.cropType.name} (${c.variety}) — ${c.field.name} — ${c.season}`,
            season: c.season,
            fieldId: c.fieldId,
            cropTypeName: c.cropType.name,
        })),
    });
}

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(user.id, "Transactions");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const {
        type, category, amount, date, description,
        season, fieldId, cropFieldId, harvestYieldId,
        inventoryItemId, quantitySold, pricePerUnit,
    } = body;

    if (!type || !category || !amount || !date || !description) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
        data: {
            farmId: farm.id,
            type,
            category,
            amount: parseFloat(amount),
            date: new Date(date),
            description,
            season: season || null,
            fieldId: fieldId || null,
            cropFieldId: cropFieldId || null,
            harvestYieldId: harvestYieldId || null,
        },
    });

    // If this is a crop sales linked to inventory, record the sales
    if (inventoryItemId && quantitySold && pricePerUnit) {
        await prisma.inventorySale.create({
            data: {
                inventoryItemId,
                transactionId: transaction.id,
                quantitySold: parseFloat(quantitySold),
                unit: body.unit ?? "kg",
                pricePerUnit: parseFloat(pricePerUnit),
                totalAmount: parseFloat(amount),
                buyerName: body.buyerName ?? null,
                saleDate: new Date(date),
                notes: body.saleNotes ?? null,
            },
        });

        // Deduct from inventory
        await prisma.inventoryItem.update({
            where: { id: inventoryItemId },
            data: {
                quantity: {
                    decrement: parseFloat(quantitySold),
                },
            },
        });
    }

    return NextResponse.json(transaction, { status: 201 });
}