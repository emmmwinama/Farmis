import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

function lotId(crop: { id: string; season: string; cropType: { name: string }; field: { name: string } }) {
  const cropCode = crop.cropType.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  const fieldCode = crop.field.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  return `${crop.season}-${fieldCode}-${cropCode}-${crop.id.slice(-5).toUpperCase()}`;
}

export async function GET() {
  const access = await requireFarmPermission("reports");
  if (access.error) return access.error;

  try {
  const crops = await prisma.cropField.findMany({
    where: { field: { farmId: access.farm.id } },
    include: {
      cropType: true,
      field: true,
      activities: {
        include: { inputs: true, labourRecords: true, otherCosts: true },
        orderBy: { date: "asc" },
      },
      yields: {
        include: {
          inventoryItems: {
            include: { sales: true },
          },
        },
        orderBy: { harvestDate: "asc" },
      },
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const lots = crops.map((crop) => {
    const sprayRecords = crop.activities.filter((activity) =>
      ["spraying", "pest control", "fertilizing", "fertilising"].includes(activity.activityType.toLowerCase()),
    );
    const harvestQuantity = crop.yields.reduce((sum, item) => sum + item.quantity, 0);
    const sales = crop.yields.flatMap((yieldRecord) =>
      yieldRecord.inventoryItems.flatMap((item) => item.sales),
    );
    const revenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return {
      id: crop.id,
      lotId: lotId(crop),
      cropName: crop.cropType.name,
      variety: crop.variety,
      fieldName: crop.field.name,
      season: crop.season,
      status: crop.status,
      plantingDate: crop.plantingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      activityCount: crop.activities.length,
      sprayRecordCount: sprayRecords.length,
      harvestCount: crop.yields.length,
      harvestQuantity,
      saleCount: sales.length,
      revenue,
      buyerNames: [...new Set(sales.map((sale) => sale.buyerName).filter(Boolean))],
      checklist: {
        cropRecord: true,
        activities: crop.activities.length > 0,
        sprayRecords: sprayRecords.length > 0,
        harvestLinked: crop.yields.length > 0,
        salesLinked: sales.length > 0,
        buyerReady: crop.activities.length > 0 && crop.yields.length > 0 && sales.length > 0,
      },
    };
  });

  const totals = {
    lots: lots.length,
    buyerReady: lots.filter((lot) => lot.checklist.buyerReady).length,
    missingActivities: lots.filter((lot) => !lot.checklist.activities).length,
    missingHarvestLinks: lots.filter((lot) => !lot.checklist.harvestLinked).length,
    missingSalesLinks: lots.filter((lot) => !lot.checklist.salesLinked).length,
  };

  return NextResponse.json({ farm: access.farm, lots, totals });
  } catch (error) {
    console.error("Failed to load traceability records", error);
    return NextResponse.json({ error: "Failed to load traceability records" }, { status: 500 });
  }
}
