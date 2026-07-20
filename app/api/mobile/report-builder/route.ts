import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  const fields = await prisma.field.findMany({
    where: { farmId: access.session.farmId! },
    include: {
      cropFields: {
        include: {
          cropType: true,
          yields: true,
          activities: { include: { inputs: true, labourRecords: true, otherCosts: true } },
          transactions: true,
        },
      },
    },
  });

  const crops = fields.flatMap((field) => field.cropFields.map((crop) => ({ ...crop, fieldName: field.name })));
  const cropProfitability = crops.map((crop) => {
    const inputCost = crop.activities.flatMap((activity) => activity.inputs).reduce((sum, input) => sum + input.totalCost, 0);
    const labourCost = crop.activities.flatMap((activity) => activity.labourRecords).reduce((sum, labour) => sum + labour.totalCost, 0);
    const otherCost = crop.activities.flatMap((activity) => activity.otherCosts).reduce((sum, other) => sum + other.amount, 0);
    const totalCost = inputCost + labourCost + otherCost;
    const revenue = crop.transactions.filter((tx) => tx.type === "Income").reduce((sum, tx) => sum + tx.amount, 0);
    const totalYieldKg = crop.yields.reduce((sum, item) => sum + item.quantity, 0);
    return {
      cropName: crop.cropType.name,
      variety: crop.variety,
      fieldName: crop.fieldName,
      season: crop.season,
      revenue,
      totalCost,
      netProfit: revenue - totalCost,
      inputCost,
      costPerKg: totalYieldKg > 0 ? inputCost / totalYieldKg : 0,
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  return NextResponse.json({
    sections: {
      cropProfitability,
      fields: fields.map((field) => ({
        name: field.name,
        area: field.totalArea,
        cultivatableArea: field.cultivatableArea,
        crops: field.cropFields.length,
      })),
    },
    availableColumns: {
      cropProfitability: ["cropName", "variety", "fieldName", "season", "revenue", "totalCost", "netProfit", "inputCost", "costPerKg"],
      fields: ["name", "area", "cultivatableArea", "crops"],
    },
  });
}
