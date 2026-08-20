import { prisma } from "@/lib/prisma";

/**
 * Whole-farm snapshot backup/restore for the Flutter mobile app's paid
 * (syncEnabled) tier — NOT a granular per-record sync queue. The mobile app
 * is offline-first with a full local SQLite copy of everything; "sync" for
 * this product is "back this device's whole farm up to the cloud" and "pull
 * it back down on a new device," not live multi-device conflict resolution.
 *
 * The JSON shape here is intentionally identical to what
 * farmis_mobile/lib/core/migration/export_service.dart produces and
 * farmis_mobile/lib/core/migration/import_service.dart reads, and to what
 * scripts/export-mobile-data.ts (the older one-time bridge) writes — same
 * field names, same flat single-farm structure, no farmId/tenancy columns
 * inside each row. That's what makes buildBackupPayload/applyBackupPayload
 * a clean round-trip with the mobile app's own export/import.
 */

function iso(date: Date | null | undefined) {
    return date ? date.toISOString() : null;
}

function parseDate(value: unknown): Date {
    const d = typeof value === "string" ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? d : new Date();
}

function parseDateOrNull(value: unknown): Date | null {
    if (value == null) return null;
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? null : d;
}

function num(value: unknown, fallback = 0): number {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : fallback;
}

function numOrNull(value: unknown): number | null {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}

/** Builds the same JSON shape the mobile app exports — read side of the round-trip. */
export async function buildBackupPayload(farmId: string) {
    const farm = await prisma.farm.findUniqueOrThrow({ where: { id: farmId } });

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
        id: f.id, name: f.name, totalArea: f.totalArea, cultivatableArea: f.cultivatableArea,
        soilType: f.soilType, locationLat: f.locationLat, locationLng: f.locationLng,
        notes: f.notes, createdAt: iso(f.createdAt),
    }));
    const fieldIds = fieldRows.map((f) => f.id);

    const fieldBoundaries = (await prisma.fieldBoundary.findMany({ where: { farmId } })).map((b) => ({
        id: b.id, fieldId: b.fieldId, geoJson: b.geoJson, areaHa: b.areaHa,
        centroidLat: b.centroidLat, centroidLng: b.centroidLng,
    }));

    const farmMarkers = (await prisma.farmMarker.findMany({ where: { farmId } })).map((m) => ({
        id: m.id, fieldId: m.fieldId, type: m.type, label: m.label, lat: m.lat, lng: m.lng,
        notes: m.notes, icon: m.icon,
    }));

    const cropFieldRowsForTypes = await prisma.cropField.findMany({
        where: { field: { farmId } }, select: { cropTypeId: true },
    });
    const usedCropTypeIds = new Set(cropFieldRowsForTypes.map((c) => c.cropTypeId));
    const cropTypes = (await prisma.cropType.findMany({
        where: { OR: [{ isCustom: false }, { id: { in: [...usedCropTypeIds] } }] },
    })).map((t) => ({ id: t.id, name: t.name, isCustom: t.isCustom }));

    const cropFieldRows = await prisma.cropField.findMany({ where: { field: { farmId } } });
    const cropFields = cropFieldRows.map((c) => ({
        id: c.id, cropTypeId: c.cropTypeId, fieldId: c.fieldId, variety: c.variety,
        areaPlanted: c.areaPlanted, season: c.season, plantingDate: iso(c.plantingDate),
        expectedHarvestDate: iso(c.expectedHarvestDate), status: c.status,
        isArchived: c.isArchived, createdAt: iso(c.createdAt),
    }));
    const cropFieldIds = cropFieldRows.map((c) => c.id);

    const activityRows = await prisma.farmActivity.findMany({ where: { fieldId: { in: fieldIds } } });
    const activities = activityRows.map((a) => ({
        id: a.id, activityType: a.activityType, date: iso(a.date), notes: a.notes,
        fieldId: a.fieldId, cropFieldId: a.cropFieldId, createdAt: iso(a.createdAt),
    }));
    const activityIds = activityRows.map((a) => a.id);

    const activityInputs = (await prisma.activityInput.findMany({ where: { activityId: { in: activityIds } } })).map((i) => ({
        id: i.id, activityId: i.activityId, inputName: i.inputName, category: i.category,
        quantity: i.quantity, unit: i.unit, unitCost: i.unitCost, totalCost: i.totalCost,
    }));

    const activityLabourRecords = (await prisma.activityLabour.findMany({ where: { activityId: { in: activityIds } } })).map((l) => ({
        id: l.id, activityId: l.activityId, employeeId: l.employeeId,
        hoursWorked: l.hoursWorked, daysWorked: l.daysWorked, totalCost: l.totalCost,
    }));

    const activityOtherCosts = (await prisma.activityOtherCost.findMany({ where: { activityId: { in: activityIds } } })).map((o) => ({
        id: o.id, activityId: o.activityId, description: o.description, amount: o.amount,
    }));

    const employees = (await prisma.employee.findMany({ where: { farmId } })).map((e) => ({
        id: e.id, name: e.name, role: e.role, payRate: e.payRate, payRateUnit: e.payRateUnit,
        phone: e.phone, isActive: e.isActive,
    }));

    const transactions = (await prisma.transaction.findMany({ where: { farmId } })).map((t) => ({
        id: t.id, type: t.type, category: t.category, amount: t.amount, date: iso(t.date),
        description: t.description, season: t.season, fieldId: t.fieldId,
        cropFieldId: t.cropFieldId, harvestYieldId: t.harvestYieldId,
    }));

    const overheadExpenses = (await prisma.overheadExpense.findMany({ where: { farmId } })).map((o) => ({
        id: o.id, description: o.description, category: o.category, amount: o.amount,
        date: iso(o.date), recurring: o.recurring, notes: o.notes,
    }));

    const harvestYields = (await prisma.harvestYield.findMany({ where: { cropFieldId: { in: cropFieldIds } } })).map((y) => ({
        id: y.id, cropFieldId: y.cropFieldId, harvestDate: iso(y.harvestDate), quantity: y.quantity,
        unit: y.unit, unitWeight: y.unitWeight, notes: y.notes, createdAt: iso(y.createdAt),
    }));

    const inventoryItemRows = await prisma.inventoryItem.findMany({ where: { farmId } });
    const inventoryItems = inventoryItemRows.map((i) => ({
        id: i.id, name: i.name, category: i.category, unit: i.unit, quantity: i.quantity,
        acquisitionUnitCost: i.acquisitionUnitCost, acquiredAt: iso(i.acquiredAt),
        unitWeight: i.unitWeight, season: i.season, cropFieldId: i.cropFieldId,
        harvestYieldId: i.harvestYieldId, notes: i.notes,
    }));
    const inventoryItemIds = inventoryItemRows.map((i) => i.id);

    const inventorySales = (await prisma.inventorySale.findMany({ where: { inventoryItemId: { in: inventoryItemIds } } })).map((s) => ({
        id: s.id, inventoryItemId: s.inventoryItemId, quantitySold: s.quantitySold, unit: s.unit,
        pricePerUnit: s.pricePerUnit, totalAmount: s.totalAmount, buyerName: s.buyerName,
        saleDate: iso(s.saleDate), notes: s.notes,
    }));

    const farmDocuments = (await prisma.farmDocument.findMany({ where: { farmId } })).map((d) => ({
        id: d.id, name: d.name, type: d.type, url: d.url, size: d.size,
        linkedTo: d.linkedTo, linkedType: d.linkedType, notes: d.notes, uploadedAt: iso(d.uploadedAt),
    }));

    const notifications = (await prisma.notification.findMany({
        where: { farmId }, orderBy: { createdAt: "desc" }, take: 50,
    })).map((n) => ({
        id: n.id, type: n.type, title: n.title, message: n.message, isRead: n.isRead,
        link: n.link, createdAt: iso(n.createdAt),
    }));

    const livestockTypes = (await prisma.livestockType.findMany({ where: { farmId } })).map((t) => ({
        id: t.id, name: t.name, category: t.category, icon: t.icon,
    }));

    const animalRows = await prisma.animal.findMany({ where: { farmId } });
    const animals = animalRows.map((a) => ({
        id: a.id, livestockTypeId: a.livestockTypeId, tag: a.tag, name: a.name,
        animalGroup: a.group, sex: a.sex, birthDate: iso(a.birthDate),
        acquisitionDate: iso(a.acquisitionDate), acquisitionType: a.acquisitionType,
        acquisitionCost: a.acquisitionCost, status: a.status, breed: a.breed,
        colour: a.colour, weight: a.weight, notes: a.notes,
    }));
    const animalIds = animalRows.map((a) => a.id);

    const animalHealthRecords = (await prisma.animalHealth.findMany({ where: { animalId: { in: animalIds } } })).map((h) => ({
        id: h.id, animalId: h.animalId, type: h.type, description: h.description,
        veterinarian: h.veterinarian, cost: h.cost, date: iso(h.date),
        nextDueDate: iso(h.nextDueDate), notes: h.notes,
    }));

    const animalProductionRecords = (await prisma.animalProduction.findMany({ where: { animalId: { in: animalIds } } })).map((p) => ({
        id: p.id, animalId: p.animalId, type: p.type, quantity: p.quantity, unit: p.unit,
        date: iso(p.date), pricePerUnit: p.pricePerUnit, totalValue: p.totalValue, notes: p.notes,
    }));

    const animalWeightRecords = (await prisma.animalWeight.findMany({ where: { animalId: { in: animalIds } } })).map((w) => ({
        id: w.id, animalId: w.animalId, weight: w.weight, unit: w.unit, date: iso(w.date), notes: w.notes,
    }));

    const animalExpenseRecords = (await prisma.animalExpense.findMany({ where: { animalId: { in: animalIds } } })).map((e) => ({
        id: e.id, animalId: e.animalId, category: e.category, description: e.description,
        amount: e.amount, date: iso(e.date), notes: e.notes,
    }));

    const animalSaleRecords = (await prisma.animalSale.findMany({ where: { animalId: { in: animalIds } } })).map((s) => ({
        id: s.id, animalId: s.animalId, saleDate: iso(s.saleDate), quantity: s.quantity,
        weightAtSale: s.weightAtSale, pricePerKg: s.pricePerKg, totalAmount: s.totalAmount,
        buyer: s.buyer, notes: s.notes,
    }));

    return {
        farmProfile, fields, fieldBoundaries, fieldZones: await buildFieldZones(farmId),
        farmMarkers, cropTypes, cropFields, activities, activityInputs, activityLabourRecords,
        activityOtherCosts, employees, transactions, overheadExpenses, harvestYields,
        inventoryItems, inventorySales, farmDocuments, notifications, livestockTypes,
        animals, animalHealthRecords, animalProductionRecords, animalWeightRecords,
        animalExpenseRecords, animalSaleRecords,
    };
}

async function buildFieldZones(farmId: string) {
    return (await prisma.fieldZone.findMany({ where: { farmId } })).map((z) => ({
        id: z.id, boundaryId: z.boundaryId, fieldId: z.fieldId, name: z.name, type: z.type,
        cropFieldId: z.cropFieldId, geoJson: z.geoJson, areaHa: z.areaHa, colour: z.colour, notes: z.notes,
    }));
}

/**
 * Upsert-by-payload-id, but ownership-checked first: if a row with this id
 * already exists and belongs to someone else (`ownerColumn`'s value doesn't
 * match `ownerValue`, or — for child tables with no direct owner column —
 * isn't in `ownedIds`), the payload's id is NEVER reused against that row;
 * a fresh id is minted instead. This is the fix for a real bug found while
 * testing this module: a mobile app that ever went through the old JSON
 * export/import bridge carries ids that originated on THIS same backend,
 * so a naive `upsert({where:{id}})` can silently attach one farm's backup
 * onto a completely different farm's pre-existing row of the same id.
 *
 * When no existing row is found at all, the payload's id is reused (not
 * minted fresh) specifically so that re-uploading the same backup updates
 * the same rows instead of duplicating them — that idempotency is the
 * whole point of this being safe to call on every app close, not just once.
 */
async function scopedUpsert(
    model: { findUnique: Function; create: Function; update: Function },
    id: string,
    ownerColumn: string,
    isOwned: (existingOwnerValue: unknown) => boolean,
    createData: Record<string, unknown>,
    updateData: Record<string, unknown>,
): Promise<string> {
    const existing = await model.findUnique({ where: { id }, select: { [ownerColumn]: true } });
    if (!existing) {
        const row = await model.create({ data: { id, ...createData } });
        return row.id;
    }
    if (!isOwned((existing as Record<string, unknown>)[ownerColumn])) {
        const row = await model.create({ data: createData }); // fresh id — never touch the collision
        return row.id;
    }
    await model.update({ where: { id }, data: updateData });
    return id;
}

/**
 * Reverse direction — upserts a mobile export payload into this farm's
 * Prisma rows, safe to call repeatedly for incremental backups (not just
 * first restore) via scopedUpsert's ownership check above.
 * payload.farmProfile.id is deliberately ignored — the authenticated
 * session's farmId is always the target, never something the client sends.
 */
export async function applyBackupPayload(farmId: string, userId: string, payload: Record<string, any>) {
    const counts: Record<string, number> = {};
    const list = (key: string) => (Array.isArray(payload[key]) ? payload[key] : []);

    const sameFarm = (v: unknown) => v === farmId;

    await prisma.$transaction(async (tx) => {
        // Every "owned ids" collection below maps the PAYLOAD's id (what
        // child rows reference via their foreign keys, since the export is
        // one internally-consistent snapshot) to the REAL id the row ended
        // up with in this database. Those two ids diverge whenever
        // scopedUpsert hits a collision and mints a fresh id instead of
        // reusing the payload's — so every downstream FK must be translated
        // through the map, never written as the raw payload id verbatim.
        const fieldIdMap = new Map<string, string>();
        for (const f of list("fields")) {
            const id = await scopedUpsert(tx.field, f.id, "farmId", sameFarm, {
                farmId, name: f.name, totalArea: num(f.totalArea),
                cultivatableArea: num(f.cultivatableArea), soilType: f.soilType ?? "Not set",
                locationLat: numOrNull(f.locationLat), locationLng: numOrNull(f.locationLng),
                notes: f.notes ?? null, createdAt: parseDate(f.createdAt),
            }, {
                name: f.name, totalArea: num(f.totalArea), cultivatableArea: num(f.cultivatableArea),
                soilType: f.soilType ?? "Not set", locationLat: numOrNull(f.locationLat),
                locationLng: numOrNull(f.locationLng), notes: f.notes ?? null,
            });
            fieldIdMap.set(f.id, id);
        }
        counts.fields = list("fields").length;

        for (const b of list("fieldBoundaries")) {
            const fieldId = fieldIdMap.get(b.fieldId);
            if (!fieldId) continue; // orphaned reference — parent field wasn't ours
            const data = {
                fieldId, geoJson: typeof b.geoJson === "string" ? b.geoJson : JSON.stringify(b.geoJson),
                areaHa: numOrNull(b.areaHa), centroidLat: numOrNull(b.centroidLat), centroidLng: numOrNull(b.centroidLng),
            };
            await scopedUpsert(tx.fieldBoundary, b.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.fieldBoundaries = list("fieldBoundaries").length;

        for (const z of list("fieldZones")) {
            const fieldId = fieldIdMap.get(z.fieldId);
            if (!fieldId) continue;
            const data = {
                boundaryId: z.boundaryId, fieldId, name: z.name ?? "Zone", type: z.type ?? "crop",
                cropFieldId: z.cropFieldId ?? null,
                geoJson: typeof z.geoJson === "string" ? z.geoJson : JSON.stringify(z.geoJson),
                areaHa: numOrNull(z.areaHa), colour: z.colour ?? null, notes: z.notes ?? null,
            };
            await scopedUpsert(tx.fieldZone, z.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.fieldZones = list("fieldZones").length;

        for (const m of list("farmMarkers")) {
            const data = {
                fieldId: m.fieldId ? fieldIdMap.get(m.fieldId) ?? null : null,
                type: m.type, label: m.label, lat: num(m.lat), lng: num(m.lng),
                notes: m.notes ?? null, icon: m.icon ?? null,
            };
            await scopedUpsert(tx.farmMarker, m.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.farmMarkers = list("farmMarkers").length;

        // Processed here (ahead of activities) so activityLabourRecords below
        // can resolve employeeId through employeeIdMap.
        const employeeIdMap = new Map<string, string>();
        for (const e of list("employees")) {
            const data = {
                name: e.name, role: e.role, payRate: num(e.payRate), payRateUnit: e.payRateUnit ?? "day",
                phone: e.phone ?? null, isActive: e.isActive ?? true,
            };
            const id = await scopedUpsert(tx.employee, e.id, "farmId", sameFarm, { farmId, ...data }, data);
            employeeIdMap.set(e.id, id);
        }
        counts.employees = list("employees").length;

        // CropType is global (unique by name, no farmId) — match by name, not
        // id: a mobile-generated or carried-over-from-an-old-import id could
        // otherwise either violate the unique(name) constraint (a different
        // id, same name as an existing type) or collide with an unrelated
        // row's id elsewhere in this globally-shared table. Not passing id
        // on create sidesteps both — Prisma generates a fresh one.
        const cropTypeIdMap = new Map<string, string>(); // payload id -> real db id
        for (const c of list("cropTypes")) {
            const row = await tx.cropType.upsert({
                where: { name: c.name },
                create: { name: c.name, isCustom: !!c.isCustom },
                update: {},
            });
            cropTypeIdMap.set(c.id, row.id);
        }
        counts.cropTypes = list("cropTypes").length;

        const cropFieldIdMap = new Map<string, string>();
        for (const c of list("cropFields")) {
            const fieldId = fieldIdMap.get(c.fieldId);
            if (!fieldId) continue;
            const data = {
                cropTypeId: cropTypeIdMap.get(c.cropTypeId) ?? c.cropTypeId,
                fieldId, variety: c.variety ?? "", areaPlanted: num(c.areaPlanted),
                season: c.season, plantingDate: parseDate(c.plantingDate),
                expectedHarvestDate: parseDate(c.expectedHarvestDate), status: c.status ?? "Active",
                isArchived: !!c.isArchived,
            };
            const id = await scopedUpsert(
                tx.cropField, c.id, "fieldId", (v) => fieldId === v,
                { ...data, createdAt: parseDate(c.createdAt) }, data,
            );
            cropFieldIdMap.set(c.id, id);
        }
        counts.cropFields = list("cropFields").length;

        const activityIdMap = new Map<string, string>();
        for (const a of list("activities")) {
            const fieldId = fieldIdMap.get(a.fieldId);
            if (!fieldId) continue;
            const data = {
                activityType: a.activityType, date: parseDate(a.date), notes: a.notes ?? "",
                fieldId, cropFieldId: a.cropFieldId ? cropFieldIdMap.get(a.cropFieldId) ?? null : null,
            };
            const id = await scopedUpsert(
                tx.farmActivity, a.id, "fieldId", (v) => fieldId === v,
                { ...data, createdById: userId, createdAt: parseDate(a.createdAt) }, data,
            );
            activityIdMap.set(a.id, id);
        }
        counts.activities = list("activities").length;

        for (const i of list("activityInputs")) {
            const activityId = activityIdMap.get(i.activityId);
            if (!activityId) continue;
            const data = {
                activityId, inputName: i.inputName, category: i.category ?? "Other",
                quantity: num(i.quantity), unit: i.unit ?? "", unitCost: num(i.unitCost), totalCost: num(i.totalCost),
            };
            await scopedUpsert(tx.activityInput, i.id, "activityId", (v) => activityId === v, data, data);
        }
        counts.activityInputs = list("activityInputs").length;

        for (const l of list("activityLabourRecords")) {
            const activityId = activityIdMap.get(l.activityId);
            const employeeId = employeeIdMap.get(l.employeeId);
            if (!activityId || !employeeId) continue;
            const data = {
                activityId, employeeId, hoursWorked: num(l.hoursWorked),
                daysWorked: num(l.daysWorked), totalCost: num(l.totalCost),
            };
            await scopedUpsert(tx.activityLabour, l.id, "activityId", (v) => activityId === v, data, data);
        }
        counts.activityLabourRecords = list("activityLabourRecords").length;

        for (const o of list("activityOtherCosts")) {
            const activityId = activityIdMap.get(o.activityId);
            if (!activityId) continue;
            const data = { activityId, description: o.description, amount: num(o.amount) };
            await scopedUpsert(tx.activityOtherCost, o.id, "activityId", (v) => activityId === v, data, data);
        }
        counts.activityOtherCosts = list("activityOtherCosts").length;

        for (const t of list("transactions")) {
            const data = {
                type: t.type, category: t.category, amount: num(t.amount), date: parseDate(t.date),
                description: t.description ?? "", season: t.season ?? null,
                fieldId: t.fieldId ? fieldIdMap.get(t.fieldId) ?? null : null,
                cropFieldId: t.cropFieldId ? cropFieldIdMap.get(t.cropFieldId) ?? null : null,
                harvestYieldId: null as string | null, // resolved below, once harvestYields has been processed
            };
            await scopedUpsert(tx.transaction, t.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.transactions = list("transactions").length;

        for (const o of list("overheadExpenses")) {
            const data = {
                description: o.description, category: o.category, amount: num(o.amount),
                date: parseDate(o.date), recurring: !!o.recurring, notes: o.notes ?? null,
            };
            await scopedUpsert(tx.overheadExpense, o.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.overheadExpenses = list("overheadExpenses").length;

        const harvestYieldIdMap = new Map<string, string>();
        for (const y of list("harvestYields")) {
            const cropFieldId = cropFieldIdMap.get(y.cropFieldId);
            if (!cropFieldId) continue;
            const data = {
                cropFieldId, harvestDate: parseDate(y.harvestDate), quantity: num(y.quantity),
                unit: y.unit ?? "kg", unitWeight: numOrNull(y.unitWeight), notes: y.notes ?? null,
            };
            const id = await scopedUpsert(
                tx.harvestYield, y.id, "cropFieldId", (v) => cropFieldId === v,
                { ...data, createdAt: parseDate(y.createdAt) }, data,
            );
            harvestYieldIdMap.set(y.id, id);
        }
        counts.harvestYields = list("harvestYields").length;

        // Now that harvestYields is resolved, backfill the transaction ->
        // harvestYield link (transactions were written above with it left
        // null, since harvestYieldIdMap didn't exist yet at that point).
        for (const t of list("transactions")) {
            if (!t.harvestYieldId) continue;
            const harvestYieldId = harvestYieldIdMap.get(t.harvestYieldId);
            if (!harvestYieldId) continue;
            await tx.transaction.updateMany({ where: { id: t.id, farmId }, data: { harvestYieldId } });
        }

        const inventoryItemIdMap = new Map<string, string>();
        for (const i of list("inventoryItems")) {
            const data = {
                name: i.name, category: i.category, unit: i.unit, quantity: num(i.quantity),
                acquisitionUnitCost: numOrNull(i.acquisitionUnitCost), acquiredAt: parseDateOrNull(i.acquiredAt),
                unitWeight: numOrNull(i.unitWeight), season: i.season ?? null,
                cropFieldId: i.cropFieldId ? cropFieldIdMap.get(i.cropFieldId) ?? null : null,
                harvestYieldId: i.harvestYieldId ? harvestYieldIdMap.get(i.harvestYieldId) ?? null : null,
                notes: i.notes ?? null,
            };
            const id = await scopedUpsert(tx.inventoryItem, i.id, "farmId", sameFarm, { farmId, ...data }, data);
            inventoryItemIdMap.set(i.id, id);
        }
        counts.inventoryItems = list("inventoryItems").length;

        for (const s of list("inventorySales")) {
            const inventoryItemId = inventoryItemIdMap.get(s.inventoryItemId);
            if (!inventoryItemId) continue;
            const data = {
                inventoryItemId, quantitySold: num(s.quantitySold), unit: s.unit ?? "",
                pricePerUnit: num(s.pricePerUnit), totalAmount: num(s.totalAmount),
                buyerName: s.buyerName ?? null, saleDate: parseDate(s.saleDate), notes: s.notes ?? null,
            };
            await scopedUpsert(tx.inventorySale, s.id, "inventoryItemId", (v) => inventoryItemId === v, data, data);
        }
        counts.inventorySales = list("inventorySales").length;

        for (const d of list("farmDocuments")) {
            // A local device file:// path or base64 blob isn't reachable from
            // the server — only a genuinely remote URL survives the upload;
            // metadata (name/type/notes) is preserved either way.
            const isRemote = typeof d.url === "string" && /^https?:\/\//.test(d.url);
            const rawSize = numOrNull(d.size);
            const data = {
                name: d.name, type: d.type, url: isRemote ? d.url : "",
                size: rawSize == null ? null : Math.trunc(rawSize),
                linkedTo: d.linkedTo ?? null, linkedType: d.linkedType ?? null, notes: d.notes ?? null,
            };
            await scopedUpsert(
                tx.farmDocument, d.id, "farmId", sameFarm,
                { farmId, ...data, uploadedAt: parseDate(d.uploadedAt) }, data,
            );
        }
        counts.farmDocuments = list("farmDocuments").length;

        for (const n of list("notifications")) {
            const data = {
                type: n.type, title: n.title, message: n.message ?? "", isRead: !!n.isRead, link: n.link ?? null,
            };
            await scopedUpsert(
                tx.notification, n.id, "farmId", sameFarm,
                { farmId, userId, ...data, createdAt: parseDate(n.createdAt) }, data,
            );
        }
        counts.notifications = list("notifications").length;

        const livestockTypeIdMap = new Map<string, string>();
        for (const t of list("livestockTypes")) {
            const existing = await tx.livestockType.findFirst({ where: { farmId, name: t.name } });
            if (existing) {
                livestockTypeIdMap.set(t.id, existing.id);
            } else {
                // Deliberately not passing id: t.id here — livestock type ids
                // can be carried over from an older import (e.g. a custom
                // type originally created via the old web app keeps its
                // original id through every re-export), so reusing it risks
                // colliding with an unrelated row elsewhere in this table.
                // Since matching is already by (farmId, name) above, an
                // auto-generated id is exactly as correct and collision-free.
                const created = await tx.livestockType.create({
                    data: { farmId, name: t.name, category: t.category ?? t.name, icon: t.icon ?? "Cattle" },
                });
                livestockTypeIdMap.set(t.id, created.id);
            }
        }
        counts.livestockTypes = list("livestockTypes").length;

        const animalIdMap = new Map<string, string>();
        for (const a of list("animals")) {
            const data = {
                livestockTypeId: livestockTypeIdMap.get(a.livestockTypeId) ?? a.livestockTypeId,
                tag: a.tag ?? null, name: a.name ?? null, group: a.animalGroup ?? null,
                sex: a.sex ?? "Unknown", birthDate: parseDateOrNull(a.birthDate),
                acquisitionDate: parseDate(a.acquisitionDate), acquisitionType: a.acquisitionType ?? "Born on farm",
                acquisitionCost: numOrNull(a.acquisitionCost), status: a.status ?? "Active",
                breed: a.breed ?? null, colour: a.colour ?? null, weight: numOrNull(a.weight), notes: a.notes ?? null,
            };
            const id = await scopedUpsert(tx.animal, a.id, "farmId", sameFarm, { farmId, ...data }, data);
            animalIdMap.set(a.id, id);
        }
        counts.animals = list("animals").length;

        for (const h of list("animalHealthRecords")) {
            const animalId = animalIdMap.get(h.animalId);
            if (!animalId) continue;
            const data = {
                animalId, type: h.type, description: h.description ?? "",
                veterinarian: h.veterinarian ?? null, cost: num(h.cost), date: parseDate(h.date),
                nextDueDate: parseDateOrNull(h.nextDueDate), notes: h.notes ?? null,
            };
            await scopedUpsert(tx.animalHealth, h.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.animalHealthRecords = list("animalHealthRecords").length;

        for (const p of list("animalProductionRecords")) {
            const animalId = p.animalId ? animalIdMap.get(p.animalId) : undefined;
            if (p.animalId && !animalId) continue; // had an owner reference that didn't resolve — skip
            const data = {
                animalId: animalId ?? null, type: p.type, quantity: num(p.quantity), unit: p.unit ?? "",
                date: parseDate(p.date), pricePerUnit: numOrNull(p.pricePerUnit), totalValue: numOrNull(p.totalValue),
                notes: p.notes ?? null,
            };
            await scopedUpsert(tx.animalProduction, p.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.animalProductionRecords = list("animalProductionRecords").length;

        for (const w of list("animalWeightRecords")) {
            const animalId = animalIdMap.get(w.animalId);
            if (!animalId) continue;
            const data = { animalId, weight: num(w.weight), unit: w.unit ?? "kg", date: parseDate(w.date), notes: w.notes ?? null };
            await scopedUpsert(tx.animalWeight, w.id, "animalId", (v) => animalId === v, data, data);
        }
        counts.animalWeightRecords = list("animalWeightRecords").length;

        for (const e of list("animalExpenseRecords")) {
            const animalId = e.animalId ? animalIdMap.get(e.animalId) : undefined;
            if (e.animalId && !animalId) continue;
            const data = {
                animalId: animalId ?? null, category: e.category, description: e.description ?? "",
                amount: num(e.amount), date: parseDate(e.date), notes: e.notes ?? null,
            };
            await scopedUpsert(tx.animalExpense, e.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.animalExpenseRecords = list("animalExpenseRecords").length;

        for (const s of list("animalSaleRecords")) {
            const animalId = animalIdMap.get(s.animalId);
            if (!animalId) continue;
            const data = {
                animalId, saleDate: parseDate(s.saleDate), quantity: Math.trunc(num(s.quantity, 1)) || 1,
                weightAtSale: numOrNull(s.weightAtSale), pricePerKg: numOrNull(s.pricePerKg),
                totalAmount: num(s.totalAmount), buyer: s.buyer ?? null, notes: s.notes ?? null,
            };
            await scopedUpsert(tx.animalSale, s.id, "farmId", sameFarm, { farmId, ...data }, data);
        }
        counts.animalSaleRecords = list("animalSaleRecords").length;
    }, { timeout: 60_000 });

    return counts;
}
