import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cropFieldId = searchParams.get("cropFieldId");

    const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
            farmId: farm.id,
            category: "crop_harvest",
            quantity: { gt: 0 },
        },
        include: {
            cropField: { include: { cropType: true, activities: {
                        include: { labourRecords: true, inputs: true, otherCosts: true },
                    }}},
        },
    });

    const results = await Promise.all(inventoryItems.map(async (item) => {
        const cf = item.cropField;
        if (!cf) return null;

        const cost =
            cf.activities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0) +
            cf.activities.flatMap((a) => a.inputs).reduce((s, i) => s + i.totalCost, 0) +
            cf.activities.flatMap((a) => a.otherCosts).reduce((s, o) => s + o.amount, 0);

        const costPerKg = item.quantity > 0 ? cost / item.quantity : 0;

        const marketPrices = await prisma.marketPrice.findMany({
            where: {
                cropName: { contains: cf.cropType.name.split(" ")[0] },
                unit: "kg",
                isActive: true,
            },
            orderBy: { priceAvg: "desc" },
        });

        const bestPrice = marketPrices[0];
        const profitPerKg = bestPrice ? bestPrice.priceAvg - costPerKg : null;
        const recommendation = bestPrice
            ? profitPerKg! > 0
                ? profitPerKg! > costPerKg * 0.3
                    ? "sell_now"
                    : "acceptable"
                : "hold"
            : "no_data";

        return {
            inventoryItemId: item.id,
            cropName: cf.cropType.name,
            variety: cf.variety,
            season: cf.season,
            availableQty: item.quantity,
            unit: item.unit,
            unitWeight: item.unitWeight,
            costPerKg: Math.round(costPerKg),
            marketPrices: marketPrices.slice(0, 5).map((p) => ({
                market: p.market,
                region: p.region,
                priceAvg: p.priceAvg,
                priceMin: p.priceMin,
                priceMax: p.priceMax,
                season: p.season,
                profitPerKg: Math.round(p.priceAvg - costPerKg),
                marginPct: costPerKg > 0 ? Math.round(((p.priceAvg - costPerKg) / costPerKg) * 100) : 0,
            })),
            bestPrice: bestPrice ? {
                market: bestPrice.market,
                priceAvg: bestPrice.priceAvg,
                profitPerKg: Math.round(profitPerKg!),
                marginPct: costPerKg > 0 ? Math.round((profitPerKg! / costPerKg) * 100) : 0,
            } : null,
            recommendation,
        };
    }));

    return NextResponse.json({ comparisons: results.filter(Boolean) });
}