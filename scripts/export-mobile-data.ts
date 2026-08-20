/**
 * One-time export of a single farm's data for import into the standalone
 * mobile app's local database.
 *
 * The mobile app no longer talks to this backend at all — this script is
 * the only bridge, run once per farm that has real data worth keeping.
 * It writes flat rows with field names matching the mobile app's drift
 * table columns (see farmis_mobile/lib/core/db/app_database.dart) so the
 * import side can insert each row with no field-renaming logic beyond what
 * is documented inline below. `farmId`/`userId`/other tenancy columns are
 * dropped since the mobile app is single-farm-per-install.
 *
 * Usage:
 *   npm run export-mobile -- <farmId>
 *
 * Writes ./mobile-export-<farmId>.json in the project root.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

function iso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

async function main() {
  const farmId = process.argv[2];
  if (!farmId) {
    console.error("Usage: npm run export-mobile -- <farmId>");
    process.exit(1);
  }

  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) {
    console.error(`No farm found with id ${farmId}`);
    process.exit(1);
  }

  console.log(`Exporting data for farm "${farm.name}" (${farmId})...`);

  const farmProfile = {
    id: farm.id,
    name: farm.name,
    location: farm.location,
    locationLat: null as number | null,
    locationLng: null as number | null,
    createdAt: iso(farm.createdAt),
  };

  const fieldRows = await prisma.field.findMany({ where: { farmId } });
  const fields = fieldRows.map((f) => ({
    id: f.id,
    name: f.name,
    totalArea: f.totalArea,
    cultivatableArea: f.cultivatableArea,
    soilType: f.soilType,
    locationLat: f.locationLat,
    locationLng: f.locationLng,
    notes: f.notes,
    createdAt: iso(f.createdAt),
  }));
  const fieldIds = fieldRows.map((f) => f.id);

  const boundaryRows = await prisma.fieldBoundary.findMany({ where: { farmId } });
  const fieldBoundaries = boundaryRows.map((b) => ({
    id: b.id,
    fieldId: b.fieldId,
    geoJson: b.geoJson,
    areaHa: b.areaHa,
    centroidLat: b.centroidLat,
    centroidLng: b.centroidLng,
  }));

  const zoneRows = await prisma.fieldZone.findMany({ where: { farmId } });
  const fieldZones = zoneRows.map((z) => ({
    id: z.id,
    boundaryId: z.boundaryId,
    fieldId: z.fieldId,
    name: z.name,
    type: z.type,
    cropFieldId: z.cropFieldId,
    geoJson: z.geoJson,
    areaHa: z.areaHa,
    colour: z.colour,
    notes: z.notes,
  }));

  const markerRows = await prisma.farmMarker.findMany({ where: { farmId } });
  const farmMarkers = markerRows.map((m) => ({
    id: m.id,
    fieldId: m.fieldId,
    type: m.type,
    label: m.label,
    lat: m.lat,
    lng: m.lng,
    notes: m.notes,
    icon: m.icon,
  }));

  // Only crop types actually used by this farm's crops, plus every
  // globally-shared (non-custom) type so lookups by name still work.
  const cropFieldRowsForTypes = await prisma.cropField.findMany({
    where: { field: { farmId } },
    select: { cropTypeId: true },
  });
  const usedCropTypeIds = new Set(cropFieldRowsForTypes.map((c) => c.cropTypeId));
  const cropTypeRows = await prisma.cropType.findMany({
    where: { OR: [{ isCustom: false }, { id: { in: [...usedCropTypeIds] } }] },
  });
  const cropTypes = cropTypeRows.map((t) => ({
    id: t.id,
    name: t.name,
    isCustom: t.isCustom,
  }));

  const cropFieldRows = await prisma.cropField.findMany({ where: { field: { farmId } } });
  const cropFields = cropFieldRows.map((c) => ({
    id: c.id,
    cropTypeId: c.cropTypeId,
    fieldId: c.fieldId,
    variety: c.variety,
    areaPlanted: c.areaPlanted,
    season: c.season,
    plantingDate: iso(c.plantingDate),
    expectedHarvestDate: iso(c.expectedHarvestDate),
    status: c.status,
    isArchived: c.isArchived,
    createdAt: iso(c.createdAt),
  }));
  const cropFieldIds = cropFieldRows.map((c) => c.id);

  const activityRows = await prisma.farmActivity.findMany({ where: { fieldId: { in: fieldIds } } });
  const activities = activityRows.map((a) => ({
    id: a.id,
    activityType: a.activityType,
    date: iso(a.date),
    notes: a.notes,
    fieldId: a.fieldId,
    cropFieldId: a.cropFieldId,
    createdAt: iso(a.createdAt),
  }));
  const activityIds = activityRows.map((a) => a.id);

  const inputRows = await prisma.activityInput.findMany({ where: { activityId: { in: activityIds } } });
  const activityInputs = inputRows.map((i) => ({
    id: i.id,
    activityId: i.activityId,
    inputName: i.inputName,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    unitCost: i.unitCost,
    totalCost: i.totalCost,
  }));

  const labourRows = await prisma.activityLabour.findMany({ where: { activityId: { in: activityIds } } });
  const activityLabourRecords = labourRows.map((l) => ({
    id: l.id,
    activityId: l.activityId,
    employeeId: l.employeeId,
    hoursWorked: l.hoursWorked,
    daysWorked: l.daysWorked,
    totalCost: l.totalCost,
  }));

  const otherCostRows = await prisma.activityOtherCost.findMany({ where: { activityId: { in: activityIds } } });
  const activityOtherCosts = otherCostRows.map((o) => ({
    id: o.id,
    activityId: o.activityId,
    description: o.description,
    amount: o.amount,
  }));

  const employeeRows = await prisma.employee.findMany({ where: { farmId } });
  const employees = employeeRows.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    payRate: e.payRate,
    payRateUnit: e.payRateUnit,
    phone: e.phone,
    isActive: e.isActive,
  }));

  const transactionRows = await prisma.transaction.findMany({ where: { farmId } });
  const transactions = transactionRows.map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    amount: t.amount,
    date: iso(t.date),
    description: t.description,
    season: t.season,
    fieldId: t.fieldId,
    cropFieldId: t.cropFieldId,
    harvestYieldId: t.harvestYieldId,
  }));

  const overheadRows = await prisma.overheadExpense.findMany({ where: { farmId } });
  const overheadExpenses = overheadRows.map((o) => ({
    id: o.id,
    description: o.description,
    category: o.category,
    amount: o.amount,
    date: iso(o.date),
    recurring: o.recurring,
    notes: o.notes,
  }));

  const yieldRows = await prisma.harvestYield.findMany({ where: { cropFieldId: { in: cropFieldIds } } });
  const harvestYields = yieldRows.map((y) => ({
    id: y.id,
    cropFieldId: y.cropFieldId,
    harvestDate: iso(y.harvestDate),
    quantity: y.quantity,
    unit: y.unit,
    unitWeight: y.unitWeight,
    notes: y.notes,
    createdAt: iso(y.createdAt),
  }));

  const inventoryItemRows = await prisma.inventoryItem.findMany({ where: { farmId } });
  const inventoryItems = inventoryItemRows.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    quantity: i.quantity,
    acquisitionUnitCost: i.acquisitionUnitCost,
    acquiredAt: iso(i.acquiredAt),
    unitWeight: i.unitWeight,
    season: i.season,
    cropFieldId: i.cropFieldId,
    harvestYieldId: i.harvestYieldId,
    notes: i.notes,
  }));
  const inventoryItemIds = inventoryItemRows.map((i) => i.id);

  const inventorySaleRows = await prisma.inventorySale.findMany({
    where: { inventoryItemId: { in: inventoryItemIds } },
  });
  const inventorySales = inventorySaleRows.map((s) => ({
    id: s.id,
    inventoryItemId: s.inventoryItemId,
    quantitySold: s.quantitySold,
    unit: s.unit,
    pricePerUnit: s.pricePerUnit,
    totalAmount: s.totalAmount,
    buyerName: s.buyerName,
    saleDate: iso(s.saleDate),
    notes: s.notes,
  }));

  const documentRows = await prisma.farmDocument.findMany({ where: { farmId } });
  const farmDocuments = documentRows.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    // May be a base64 data: URL — the mobile import decodes it to a real
    // file on-device; this script just passes it through unchanged.
    url: d.url,
    size: d.size,
    linkedTo: d.linkedTo,
    linkedType: d.linkedType,
    notes: d.notes,
    uploadedAt: iso(d.uploadedAt),
  }));

  const notificationRows = await prisma.notification.findMany({
    where: { farmId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const notifications = notificationRows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    link: n.link,
    createdAt: iso(n.createdAt),
  }));

  const livestockTypeRows = await prisma.livestockType.findMany({ where: { farmId } });
  const livestockTypes = livestockTypeRows.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    icon: t.icon,
  }));

  const animalRows = await prisma.animal.findMany({ where: { farmId } });
  const animals = animalRows.map((a) => ({
    id: a.id,
    livestockTypeId: a.livestockTypeId,
    tag: a.tag,
    name: a.name,
    // Prisma calls this `group`; the mobile column is `animalGroup`
    // because `group` is a reserved SQL keyword.
    animalGroup: a.group,
    sex: a.sex,
    birthDate: iso(a.birthDate),
    acquisitionDate: iso(a.acquisitionDate),
    acquisitionType: a.acquisitionType,
    acquisitionCost: a.acquisitionCost,
    status: a.status,
    breed: a.breed,
    colour: a.colour,
    weight: a.weight,
    notes: a.notes,
  }));
  const animalIds = animalRows.map((a) => a.id);

  const healthRows = await prisma.animalHealth.findMany({ where: { animalId: { in: animalIds } } });
  const animalHealthRecords = healthRows.map((h) => ({
    id: h.id,
    animalId: h.animalId,
    type: h.type,
    description: h.description,
    veterinarian: h.veterinarian,
    cost: h.cost,
    date: iso(h.date),
    nextDueDate: iso(h.nextDueDate),
    notes: h.notes,
  }));

  const productionRows = await prisma.animalProduction.findMany({
    where: { animalId: { in: animalIds } },
  });
  const animalProductionRecords = productionRows.map((p) => ({
    id: p.id,
    animalId: p.animalId,
    type: p.type,
    quantity: p.quantity,
    unit: p.unit,
    date: iso(p.date),
    pricePerUnit: p.pricePerUnit,
    totalValue: p.totalValue,
    notes: p.notes,
  }));

  const weightRows = await prisma.animalWeight.findMany({ where: { animalId: { in: animalIds } } });
  const animalWeightRecords = weightRows.map((w) => ({
    id: w.id,
    animalId: w.animalId,
    weight: w.weight,
    unit: w.unit,
    date: iso(w.date),
    notes: w.notes,
  }));

  const expenseRows = await prisma.animalExpense.findMany({ where: { animalId: { in: animalIds } } });
  const animalExpenseRecords = expenseRows.map((e) => ({
    id: e.id,
    animalId: e.animalId,
    category: e.category,
    description: e.description,
    amount: e.amount,
    date: iso(e.date),
    notes: e.notes,
  }));

  const saleRows = await prisma.animalSale.findMany({ where: { animalId: { in: animalIds } } });
  const animalSaleRecords = saleRows.map((s) => ({
    id: s.id,
    animalId: s.animalId,
    saleDate: iso(s.saleDate),
    quantity: s.quantity,
    weightAtSale: s.weightAtSale,
    pricePerKg: s.pricePerKg,
    totalAmount: s.totalAmount,
    buyer: s.buyer,
    notes: s.notes,
  }));

  const payload = {
    farmProfile,
    fields,
    fieldBoundaries,
    fieldZones,
    farmMarkers,
    cropTypes,
    cropFields,
    activities,
    activityInputs,
    activityLabourRecords,
    activityOtherCosts,
    employees,
    transactions,
    overheadExpenses,
    harvestYields,
    inventoryItems,
    inventorySales,
    farmDocuments,
    notifications,
    livestockTypes,
    animals,
    animalHealthRecords,
    animalProductionRecords,
    animalWeightRecords,
    animalExpenseRecords,
    animalSaleRecords,
  };

  const outPath = `mobile-export-${farmId}.json`;
  writeFileSync(outPath, JSON.stringify(payload, null, 2));

  const counts = Object.entries(payload)
    .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? value.length : 1}`)
    .join("\n");
  console.log(`Wrote ${outPath}\n${counts}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
