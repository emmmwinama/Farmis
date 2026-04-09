import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const season = searchParams.get("season");

    const items = await prisma.inventoryItem.findMany({
        where: {
            farmId: farm.id,
            ...(category ? { category } : {}),
            ...(season ? { season } : {}),
        },
        include: {
            cropField: { include: { cropType: true, field: true } },
            harvestYield: true,
            sales: {
                orderBy: { saleDate: "desc" },
                include: { transaction: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const result = items.map((item) => {
        const totalSold = item.sales.reduce((s, sale) => s + sale.quantitySold, 0);
        const totalRevenue = item.sales.reduce((s, sale) => s + sale.totalAmount, 0);
        const remainingQty = item.quantity;

        return {
            id: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: remainingQty,
            unitWeight: item.unitWeight,
            season: item.season,
            notes: item.notes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            cropFieldId: item.cropFieldId,
            cropName: item.cropField?.cropType?.name ?? null,
            cropVariety: item.cropField?.variety ?? null,
            fieldName: item.cropField?.field?.name ?? null,
            harvestYieldId: item.harvestYieldId,
            totalSold,
            totalRevenue,
            remainingQty,
            quantityKg: item.unit === "kg"
                ? remainingQty
                : item.unit === "tonnes"
                    ? remainingQty * 1000
                    : item.unitWeight
                        ? remainingQty * item.unitWeight
                        : remainingQty,
            sales: item.sales.map((s) => ({
                id: s.id,
                quantitySold: s.quantitySold,
                unit: s.unit,
                pricePerUnit: s.pricePerUnit,
                totalAmount: s.totalAmount,
                buyerName: s.buyerName,
                saleDate: s.saleDate,
                notes: s.notes,
            })),
        };
    });

    // Aggregate by category
    const byCategory: Record<string, { count: number; totalQuantityKg: number; totalRevenue: number }> = {};
    for (const item of result) {
        if (!byCategory[item.category])
            byCategory[item.category] = { count: 0, totalQuantityKg: 0, totalRevenue: 0 };
        byCategory[item.category].count += 1;
        byCategory[item.category].totalQuantityKg += item.quantityKg;
        byCategory[item.category].totalRevenue += item.totalRevenue;
    }

    // Aggregate by season
    const bySeason: Record<string, { count: number; totalRevenue: number }> = {};
    for (const item of result) {
        const key = item.season ?? "General";
        if (!bySeason[key]) bySeason[key] = { count: 0, totalRevenue: 0 };
        bySeason[key].count += 1;
        bySeason[key].totalRevenue += item.totalRevenue;
    }

    const allSeasons = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "desc" },
    });

    return NextResponse.json({
        items: result,
        byCategory: Object.entries(byCategory).map(([cat, data]) => ({ category: cat, ...data })),
        bySeason: Object.entries(bySeason).map(([season, data]) => ({ season, ...data })),
        allSeasons: allSeasons.map((s) => s.season),
        totals: {
            items: result.length,
            totalRevenue: result.reduce((s, i) => s + i.totalRevenue, 0),
        },
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, category, unit, quantity, unitWeight, season, cropFieldId, notes } = body;

    if (!name || !category || !unit || quantity === undefined) {
        return NextResponse.json({ error: "Name, category, unit and quantity are required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
        data: {
            farmId: farm.id,
            name,
            category,
            unit,
            quantity: parseFloat(quantity),
            unitWeight: unitWeight ? parseFloat(unitWeight) : null,
            season: season || null,
            cropFieldId: cropFieldId || null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(item, { status: 201 });
}