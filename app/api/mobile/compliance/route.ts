import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "reports");
  if (access.error) return access.error;

  const [crops, documents, boundaries, markers] = await Promise.all([
    prisma.cropField.findMany({
      where: { field: { farmId: access.session.farmId! } },
      include: { cropType: true, field: true, activities: true, yields: { include: { inventoryItems: { include: { sales: true } } } } },
    }),
    prisma.farmDocument.findMany({ where: { farmId: access.session.farmId! }, orderBy: { uploadedAt: "desc" } }),
    prisma.fieldBoundary.count({ where: { farmId: access.session.farmId! } }),
    prisma.farmMarker.count({ where: { farmId: access.session.farmId! } }),
  ]);

  const lots = crops.map((crop) => {
    const sales = crop.yields.flatMap((yieldRecord) => yieldRecord.inventoryItems.flatMap((item) => item.sales));
    return {
      id: crop.id,
      cropName: crop.cropType.name,
      fieldName: crop.field.name,
      season: crop.season,
      checklist: {
        fieldMapped: boundaries > 0,
        activitiesRecorded: crop.activities.length > 0,
        harvestRecorded: crop.yields.length > 0,
        salesLinked: sales.length > 0,
        documentsAttached: documents.some((doc) => doc.linkedTo === crop.id || doc.linkedType === "crop"),
      },
    };
  });

  const checklist = [
    { key: "mappedFields", label: "Mapped field evidence", passed: boundaries > 0, value: boundaries },
    { key: "farmMarkers", label: "Farm markers recorded", passed: markers > 0, value: markers },
    { key: "cropLots", label: "Crop lots available", passed: crops.length > 0, value: crops.length },
    { key: "documents", label: "Documents uploaded", passed: documents.length > 0, value: documents.length },
    { key: "buyerReadyLots", label: "Buyer-ready traceability lots", passed: lots.some((lot) => Object.values(lot.checklist).filter(Boolean).length >= 4), value: lots.length },
  ];

  return NextResponse.json({
    checklist,
    lots,
    documents,
    readinessPct: Math.round((checklist.filter((item) => item.passed).length / checklist.length) * 100),
    workflow: { fullComplianceWorkflow: false, source: "traceability and evidence checklist" },
  });
}
