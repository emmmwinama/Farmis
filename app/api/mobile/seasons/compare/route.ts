import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

function toKg(quantity: number, unit: string, unitWeight?: number | null) {
  const u = unit.toLowerCase();
  if (u === "kg") return quantity;
  if (u === "tonne" || u === "tonnes" || u === "t") return quantity * 1000;
  if (u.startsWith("bag")) return quantity * (unitWeight ?? 50);
  return quantity;
}

function diff(a: number, b: number, higherIsBetter = true) {
  const value = a - b;
  const pct = b !== 0 ? (value / Math.abs(b)) * 100 : null;
  const improved = Math.abs(value) < 0.0001 ? null : higherIsBetter ? value > 0 : value < 0;
  return { value, pct, improved };
}

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;
  const farmId = access.session.farmId!;

  const { searchParams } = new URL(req.url);
  const seasonA = searchParams.get("a") ?? searchParams.get("seasonA");
  const seasonB = searchParams.get("b") ?? searchParams.get("seasonB");

  const allSeasons = await prisma.cropField.findMany({
    where: { field: { farmId } },
    select: { season: true },
    distinct: ["season"],
    orderBy: { season: "desc" },
  });

  if (!seasonA || !seasonB) {
    return NextResponse.json({
      error: "Two seasons are required",
      allSeasons: allSeasons.map((row) => row.season),
      selector: { requires: ["a", "b"] },
    }, { status: 400 });
  }

  async function seasonData(season: string) {
    const crops = await prisma.cropField.findMany({
      where: { season, field: { farmId } },
      include: {
        cropType: true,
        field: true,
        yields: true,
        transactions: true,
        activities: { include: { labourRecords: true, inputs: true, otherCosts: true } },
      },
    });

    let totalCost = 0;
    let totalYieldKg = 0;
    let revenue = 0;
    let totalArea = 0;
    const cropTypes = new Set<string>();
    for (const crop of crops) {
      cropTypes.add(crop.cropType.name);
      totalArea += crop.areaPlanted;
      totalCost += crop.activities.reduce((sum, activity) =>
        sum +
        activity.inputs.reduce((s, input) => s + input.totalCost, 0) +
        activity.labourRecords.reduce((s, labour) => s + labour.totalCost, 0) +
        activity.otherCosts.reduce((s, other) => s + other.amount, 0), 0);
      totalYieldKg += crop.yields.reduce((sum, item) => sum + toKg(item.quantity, item.unit, item.unitWeight), 0);
      revenue += crop.transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
    }

    return {
      season,
      cropCount: crops.length,
      cropTypes: [...cropTypes],
      totalArea,
      totalCost,
      revenue,
      netProfit: revenue - totalCost,
      totalYieldKg,
      yieldPerHa: totalArea > 0 ? totalYieldKg / totalArea : 0,
      costPerHa: totalArea > 0 ? totalCost / totalArea : 0,
      costPerKg: totalYieldKg > 0 ? totalCost / totalYieldKg : null,
      rows: crops.map((crop) => ({
        id: crop.id,
        cropName: crop.cropType.name,
        fieldName: crop.field.name,
        variety: crop.variety,
        areaPlanted: crop.areaPlanted,
        status: crop.status,
      })),
    };
  }

  const [a, b] = await Promise.all([seasonData(seasonA), seasonData(seasonB)]);

  return NextResponse.json({
    allSeasons: allSeasons.map((row) => row.season),
    seasonA: a,
    seasonB: b,
    comparison: {
      crops: diff(a.cropCount, b.cropCount),
      area: diff(a.totalArea, b.totalArea),
      totalCost: diff(a.totalCost, b.totalCost, false),
      revenue: diff(a.revenue, b.revenue),
      netProfit: diff(a.netProfit, b.netProfit),
      totalYieldKg: diff(a.totalYieldKg, b.totalYieldKg),
      yieldPerHa: diff(a.yieldPerHa, b.yieldPerHa),
      costPerHa: diff(a.costPerHa, b.costPerHa, false),
      costPerKg: a.costPerKg != null && b.costPerKg != null ? diff(a.costPerKg, b.costPerKg, false) : null,
    },
  });
}
