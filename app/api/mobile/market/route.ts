import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const crop = searchParams.get("crop");
    const region = searchParams.get("region");
    const season = searchParams.get("season");

    const prices = await prisma.marketPrice.findMany({
        where: {
            isActive: true,
            ...(crop && crop !== "All" ? { cropName: crop } : {}),
            ...(region && region !== "All" ? { region } : {}),
            ...(season && season !== "All" ? { season } : {}),
        },
        orderBy: [
            { cropName: "asc" },
            { market: "asc" },
            { recordedAt: "desc" },
        ],
    });

    const allPrices = await prisma.marketPrice.findMany({
        where: { isActive: true },
        select: {
            cropName: true,
            market: true,
            region: true,
            season: true,
        },
    });

    const seasons = [
        ...new Set(allPrices.map((item) => item.season).filter(Boolean) as string[]),
    ].sort((a, b) => b.localeCompare(a));
    const currentSeason = seasons[0] ?? null;
    const previousSeason = seasons[1] ?? null;

    const current = allPricesForSeason(prices, currentSeason);
    const previous = allPricesForSeason(
        await prisma.marketPrice.findMany({
            where: {
                isActive: true,
                ...(previousSeason ? { season: previousSeason } : {}),
            },
        }),
        previousSeason
    );

    const seasonComparison = current.map((item) => {
        const previousItem = previous.find((p) => p.cropName === item.cropName);
        const previousAvg = previousItem?.priceAvg ?? 0;
        const change = item.priceAvg - previousAvg;
        return {
            cropName: item.cropName,
            currentAvg: item.priceAvg,
            previousAvg,
            change,
            changePct: previousAvg > 0 ? (change / previousAvg) * 100 : 0,
            unit: item.unit,
        };
    });

    return NextResponse.json({
        prices,
        allCrops: uniqueSorted(allPrices.map((item) => item.cropName)),
        allMarkets: uniqueSorted(allPrices.map((item) => item.market)),
        allRegions: uniqueSorted(allPrices.map((item) => item.region)),
        allSeasons: seasons,
        currentSeason,
        previousSeason,
        seasonComparison,
    });
}

function uniqueSorted(values: string[]) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function allPricesForSeason(
    prices: Array<{ cropName: string; unit: string; priceAvg: number; season: string | null }>,
    season: string | null
) {
    const seen = new Set<string>();
    return prices.filter((item) => {
        if (season && item.season !== season) return false;
        const key = `${item.cropName}:${item.unit}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
