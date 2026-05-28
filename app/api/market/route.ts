import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cropName = searchParams.get("crop");
    const unit = searchParams.get("unit");
    const region = searchParams.get("region");
    const season = searchParams.get("season");

    const prices = await prisma.marketPrice.findMany({
        where: {
            isActive: true,
            ...(cropName ? { cropName: { contains: cropName } } : {}),
            ...(unit ? { unit } : {}),
            ...(region ? { region } : {}),
            ...(season ? { season } : {}),
        },
        orderBy: [{ cropName: "asc" }, { market: "asc" }],
    });

    // Get all unique crops
    const allCrops = [...new Set(prices.map((p) => p.cropName))].sort();
    const allMarkets = [...new Set(prices.map((p) => p.market))].sort();
    const allRegions = [...new Set(prices.map((p) => p.region))].sort();
    const allSeasons = [...new Set(prices.map((p) => p.season).filter(Boolean))].sort((a, b) => (b ?? "").localeCompare(a ?? ""));

    // Group by crop for comparison
    const byCrop: Record<string, {
        cropName: string;
        markets: Array<{
            market: string; region: string; unit: string;
            priceMin: number; priceMax: number; priceAvg: number;
            season: string | null; source: string;
        }>;
    }> = {};

    for (const p of prices) {
        if (!byCrop[p.cropName]) byCrop[p.cropName] = { cropName: p.cropName, markets: [] };
        byCrop[p.cropName].markets.push({
            market: p.market,
            region: p.region,
            unit: p.unit,
            priceMin: p.priceMin,
            priceMax: p.priceMax,
            priceAvg: p.priceAvg,
            season: p.season,
            source: p.source,
        });
    }

    // Season-over-season comparison for key crops
    const seasonComparison: Record<string, {
        cropName: string; currentAvg: number; previousAvg: number;
        change: number; changePct: number; unit: string;
    }> = {};

    const currentSeason = allSeasons[0];
    const previousSeason = allSeasons[1];

    if (currentSeason && previousSeason) {
        const currentPrices = prices.filter((p) => p.season === currentSeason && p.market === "ADMARC" && p.unit === "kg");
        const previousPrices = prices.filter((p) => p.season === previousSeason && p.market === "ADMARC" && p.unit === "kg");

        for (const cp of currentPrices) {
            const pp = previousPrices.find((p) => p.cropName === cp.cropName);
            if (pp) {
                const change = cp.priceAvg - pp.priceAvg;
                seasonComparison[cp.cropName] = {
                    cropName: cp.cropName,
                    currentAvg: cp.priceAvg,
                    previousAvg: pp.priceAvg,
                    change,
                    changePct: pp.priceAvg > 0 ? (change / pp.priceAvg) * 100 : 0,
                    unit: "kg",
                };
            }
        }
    }

    return NextResponse.json({
        prices,
        byCrop: Object.values(byCrop),
        allCrops,
        allMarkets,
        allRegions,
        allSeasons,
        currentSeason,
        previousSeason,
        seasonComparison: Object.values(seasonComparison),
    });
}