import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

function lotId(crop: { id: string; season: string; cropType: { name: string }; field: { name: string } }) {
  const cropCode = crop.cropType.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  const fieldCode = crop.field.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  return `${crop.season}-${fieldCode}-${cropCode}-${crop.id.slice(-5).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  const crops = await prisma.cropField.findMany({
    where: { field: { farmId: access.session.farmId! } },
    include: {
      cropType: true,
      field: true,
      activities: { include: { inputs: true }, orderBy: { date: "asc" } },
      yields: { include: { inventoryItems: { include: { sales: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const lots = crops.map((crop) => {
    const sprayRecords = crop.activities.filter((activity) =>
      ["spraying", "pest control", "fertilizing", "fertilising"].includes(activity.activityType.toLowerCase()),
    );
    const sales = crop.yields.flatMap((yieldRecord) =>
      yieldRecord.inventoryItems.flatMap((item) => item.sales),
    );
    return {
      id: crop.id,
      lotId: lotId(crop),
      cropName: crop.cropType.name,
      variety: crop.variety,
      fieldName: crop.field.name,
      season: crop.season,
      status: crop.status,
      activityCount: crop.activities.length,
      sprayRecordCount: sprayRecords.length,
      harvestCount: crop.yields.length,
      saleCount: sales.length,
      revenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      checklist: {
        activities: crop.activities.length > 0,
        sprayRecords: sprayRecords.length > 0,
        harvestLinked: crop.yields.length > 0,
        salesLinked: sales.length > 0,
        buyerReady: crop.activities.length > 0 && crop.yields.length > 0 && sales.length > 0,
      },
    };
  });

  return NextResponse.json({ lots });
}
