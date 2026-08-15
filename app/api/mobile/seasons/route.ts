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

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const seasonFilter = searchParams.get("season");

  const fields = await prisma.field.findMany({
    where: { farmId: access.session.farmId! },
    include: {
      cropFields: {
        where: seasonFilter ? { season: seasonFilter } : undefined,
        include: {
          cropType: true,
          yields: true,
          transactions: true,
          activities: { include: { labourRecords: true, inputs: true, otherCosts: true } },
        },
      },
    },
  });

  const seasons = new Map<string, any>();
  for (const field of fields) {
    for (const crop of field.cropFields) {
      if (!seasons.has(crop.season)) {
        seasons.set(crop.season, {
          season: crop.season,
          fields: new Set<string>(),
          crops: new Set<string>(),
          cropRows: [],
          cropCount: 0,
          totalArea: 0,
          totalCost: 0,
          revenue: 0,
          totalYieldKg: 0,
          activeCrops: 0,
          archivedCrops: 0,
          activityCount: 0,
        });
      }
      const row = seasons.get(crop.season);
      const inputCost = crop.activities.flatMap((activity) => activity.inputs).reduce((sum, input) => sum + input.totalCost, 0);
      const labourCost = crop.activities.flatMap((activity) => activity.labourRecords).reduce((sum, labour) => sum + labour.totalCost, 0);
      const otherCost = crop.activities.flatMap((activity) => activity.otherCosts).reduce((sum, other) => sum + other.amount, 0);
      const cost = inputCost + labourCost + otherCost;
      const revenue = crop.transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
      const totalYieldKg = crop.yields.reduce((sum, item) => sum + toKg(item.quantity, item.unit, item.unitWeight), 0);

      row.fields.add(field.name);
      row.crops.add(crop.cropType.name);
      row.cropCount += 1;
      row.totalArea += crop.areaPlanted;
      row.totalCost += cost;
      row.revenue += revenue;
      row.totalYieldKg += totalYieldKg;
      row.activityCount += crop.activities.length;
      if (crop.isArchived || crop.status === "Archived") row.archivedCrops += 1;
      else row.activeCrops += 1;
      row.cropRows.push({
        id: crop.id,
        cropName: crop.cropType.name,
        variety: crop.variety,
        fieldName: field.name,
        status: crop.status,
        areaPlanted: crop.areaPlanted,
        totalCost: cost,
        revenue,
        totalYieldKg,
      });
    }
  }

  const rows = [...seasons.values()]
    .map((season) => ({
      ...season,
      fields: [...season.fields],
      crops: [...season.crops],
      netProfit: season.revenue - season.totalCost,
      yieldPerHa: season.totalArea > 0 ? season.totalYieldKg / season.totalArea : 0,
      costPerHa: season.totalArea > 0 ? season.totalCost / season.totalArea : 0,
      costPerKg: season.totalYieldKg > 0 ? season.totalCost / season.totalYieldKg : null,
    }))
    .sort((a, b) => b.season.localeCompare(a.season));

  return NextResponse.json({
    allSeasons: rows.map((row) => row.season),
    seasons: rows,
    selectedSeason: seasonFilter ?? null,
    workflow: {
      supportsNativeCreateEditArchive: false,
      source: "Seasons are currently derived from crop records.",
    },
  });
}
