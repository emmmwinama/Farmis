import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession, requireMobilePermission } from "@/lib/mobileAuth";
import { checkLimit } from "@/lib/subscription";

function unpackNotes(notes: string | null | undefined) {
    const text = notes ?? "";
    const match = text.match(/^\[Responsible:\s*(.*?)\]\n?/i);
    return {
        responsiblePersonName: match?.[1]?.trim() || null,
        notes: match ? text.slice(match[0].length).trim() : text,
    };
}

const DEFAULT_ANNUAL_CARRYING_RATE = 0.12;

function costAtUse(unitCost: number, acquiredAt: Date | null, usedAt: Date) {
    if (!acquiredAt) return { unitCostAtUse: unitCost, timeValuePerUnit: 0 };
    const daysHeld = Math.max(0, Math.ceil((usedAt.getTime() - acquiredAt.getTime()) / 86_400_000));
    const timeValuePerUnit = unitCost * DEFAULT_ANNUAL_CARRYING_RATE * (daysHeld / 365);
    return {
        unitCostAtUse: unitCost + timeValuePerUnit,
        timeValuePerUnit,
    };
}

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fieldId     = searchParams.get("fieldId");
    const cropFieldId = searchParams.get("cropFieldId");

    const fields = await prisma.field.findMany({
        where:  { farmId: session.farmId },
        select: { id: true },
    });
    const fieldIds = fields.map((f) => f.id);

    const activities = await prisma.farmActivity.findMany({
        where: {
            fieldId:     fieldId     ? fieldId     : { in: fieldIds },
            cropFieldId: cropFieldId ? cropFieldId : undefined,
        },
        include: {
            field:    true,
            cropField: { include: { cropType: true } },
            inputs:   true,
            labourRecords: {
                include: { employee: true },
            },
            otherCosts: true,
        },
        orderBy: { date: "desc" },
    });

    const mapped = activities.map((a) => {
        const totalInputCost  = a.inputs.reduce((s, i) => s + i.totalCost, 0);
        const totalLabourCost = a.labourRecords.reduce((s, l) => s + l.totalCost, 0);
        const totalOtherCost  = a.otherCosts.reduce((s, o) => s + o.amount, 0);

        const noteData = unpackNotes(a.notes);

        return {
            id:           a.id,
            activityType: a.activityType,
            date:         a.date,
            notes:        noteData.notes,
            responsiblePersonName: a.responsiblePersonName ?? noteData.responsiblePersonName,
            fieldId:      a.fieldId,
            fieldName:    a.field.name,
            cropFieldId:  a.cropFieldId,
            cropName:     a.cropField?.cropType?.name ?? null,
            cropVariety:  a.cropField?.variety ?? null,
            season:       a.cropField?.season ?? null,
            totalCost:        totalInputCost + totalLabourCost + totalOtherCost,
            totalInputCost,
            totalLabourCost,
            totalOtherCost,
            inputCount:   a.inputs.length,
            labourCount:  a.labourRecords.length,
            inputs: a.inputs.map((i) => ({
                id:        i.id,
                inputName: i.inputName,
                category:  i.category,
                quantity:  i.quantity,
                unit:      i.unit,
                unitCost:  i.unitCost,
                totalCost: i.totalCost,
                acquisitionUnitCost: i.acquisitionUnitCost,
                timeValueCost: i.timeValueCost,
                inventoryItemId: i.inventoryItemId,
            })),
            labourRecords: a.labourRecords.map((l) => ({
                id:           l.id,
                employeeName: l.employee.name,
                hoursWorked:  l.hoursWorked,
                daysWorked:   l.daysWorked,
                totalCost:    l.totalCost,
            })),
            otherCosts: a.otherCosts.map((o) => ({
                id:          o.id,
                description: o.description,
                amount:      o.amount,
            })),
        };
    });

    // Analytics
    const allSeasons = [...new Set(
        activities
            .map((a) => a.cropField?.season)
            .filter(Boolean) as string[]
    )].sort((a, b) => b.localeCompare(a));

    // By type
    const typeMap: Record<string, { count: number; totalCost: number }> = {};
    for (const a of mapped) {
        if (!typeMap[a.activityType])
            typeMap[a.activityType] = { count: 0, totalCost: 0 };
        typeMap[a.activityType].count++;
        typeMap[a.activityType].totalCost += a.totalCost;
    }
    const byType = Object.entries(typeMap)
        .map(([type, v]) => ({ type, ...v }))
        .sort((a, b) => b.count - a.count);

    // By field
    const fieldMap: Record<string, { count: number; totalCost: number }> = {};
    for (const a of mapped) {
        if (!fieldMap[a.fieldName])
            fieldMap[a.fieldName] = { count: 0, totalCost: 0 };
        fieldMap[a.fieldName].count++;
        fieldMap[a.fieldName].totalCost += a.totalCost;
    }
    const byField = Object.entries(fieldMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count);

    // By season
    const seasonMap: Record<string, { count: number; totalCost: number; types: Set<string> }> = {};
    for (const a of mapped) {
        const s = a.season ?? "No season";
        if (!seasonMap[s])
            seasonMap[s] = { count: 0, totalCost: 0, types: new Set() };
        seasonMap[s].count++;
        seasonMap[s].totalCost += a.totalCost;
        seasonMap[s].types.add(a.activityType);
    }
    const bySeason = Object.entries(seasonMap)
        .map(([season, v]) => ({
            season,
            count:     v.count,
            totalCost: v.totalCost,
            types:     [...v.types],
        }))
        .sort((a, b) => b.season.localeCompare(a.season));

    return NextResponse.json({
        activities: mapped,
        allSeasons,
        byType,
        byField,
        bySeason,
    });
}

export async function POST(req: NextRequest) {
    const access = await requireMobilePermission(req, "activities");
    if (access.error) return access.error;
    const { session } = access;
    const farmId = session.farmId!;

    try {
        await checkLimit(session.userId, "Activities");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { fieldId, cropFieldId, activityType, date, notes, responsibleEmployeeId, responsiblePersonName } = body;

    if (!fieldId || !activityType || !date)
        return NextResponse.json(
            { error: "fieldId, activityType and date are required" },
            { status: 400 }
        );
    const activityDate = new Date(date);
    if (Number.isNaN(activityDate.getTime())) {
        return NextResponse.json({ error: "Activity date must be valid" }, { status: 400 });
    }

    const field = await prisma.field.findFirst({
        where: { id: fieldId, farmId },
    });
    if (!field)
        return NextResponse.json({ error: "Field not found" }, { status: 404 });

    let cropField = null;
    if (cropFieldId) {
        cropField = await prisma.cropField.findFirst({
            where: { id: cropFieldId, field: { farmId } },
        });
        if (!cropField) return NextResponse.json({ error: "Crop record not found" }, { status: 404 });
        if (activityDate < cropField.plantingDate || activityDate > cropField.expectedHarvestDate) {
            return NextResponse.json(
                { error: "Activity date must fall within the crop planting and harvest window" },
                { status: 400 },
            );
        }
    }

    const duplicate = await prisma.farmActivity.findFirst({
        where: {
            fieldId,
            cropFieldId: cropFieldId ?? null,
            activityType,
            date: activityDate,
            createdById: session.userId,
        },
    });
    if (duplicate) {
        return NextResponse.json({ error: "A matching activity record already exists" }, { status: 409 });
    }

    const normalisedInputs = [];
    const inventoryDeductions: Array<{ id: string; quantity: number; unit: string; notes: string | null }> = [];

    for (const rawInput of body.inputs ?? []) {
        const quantity = parseFloat(rawInput.quantity) || 0;
        if ((!rawInput.inputName && !rawInput.inventoryItemId) || quantity <= 0) continue;

        if (rawInput.inventoryItemId) {
            const inventory = await prisma.inventoryItem.findFirst({
                where: { id: rawInput.inventoryItemId, farmId },
            });
            if (!inventory) {
                return NextResponse.json({ error: "Selected inventory item was not found" }, { status: 404 });
            }
            if (inventory.unit !== rawInput.unit) {
                return NextResponse.json(
                    { error: `${inventory.name} is tracked in ${inventory.unit}. Use the same unit when consuming stock.` },
                    { status: 400 },
                );
            }
            if (quantity > inventory.quantity) {
                return NextResponse.json(
                    { error: `Only ${inventory.quantity} ${inventory.unit} available for ${inventory.name}` },
                    { status: 400 },
                );
            }

            const acquisitionUnitCost = inventory.acquisitionUnitCost ?? (parseFloat(rawInput.unitCost) || 0);
            const cost = costAtUse(acquisitionUnitCost, inventory.acquiredAt, activityDate);
            normalisedInputs.push({
                inputName: inventory.name,
                category: rawInput.category || inventory.category,
                quantity,
                unit: inventory.unit,
                unitCost: cost.unitCostAtUse,
                totalCost: quantity * cost.unitCostAtUse,
                acquisitionUnitCost,
                timeValueCost: quantity * cost.timeValuePerUnit,
                inventoryItemId: inventory.id,
            });
            inventoryDeductions.push({ id: inventory.id, quantity, unit: inventory.unit, notes: inventory.notes });
            continue;
        }

        const unitCost = parseFloat(rawInput.unitCost) || 0;
        normalisedInputs.push({
            inputName: rawInput.inputName,
            category: rawInput.category,
            quantity,
            unit: rawInput.unit,
            unitCost,
            totalCost: quantity * unitCost,
            acquisitionUnitCost: null,
            timeValueCost: null,
            inventoryItemId: null,
        });
    }

    const activity = await prisma.farmActivity.create({
        data: {
            fieldId,
            cropFieldId: cropFieldId ?? null,
            activityType,
            date:        activityDate,
            notes:       notes ?? null,
            responsibleEmployeeId: responsibleEmployeeId ?? null,
            responsiblePersonName: responsibleEmployeeId ? null : String(responsiblePersonName ?? "").trim() || null,
            createdById: session.userId,
            labourRecords: {
                create: (body.labourRecords ?? []).filter((l: any) => l.employeeId).map((l: any) => ({
                    employeeId: l.employeeId,
                    hoursWorked: parseFloat(l.hoursWorked) || 0,
                    daysWorked: parseFloat(l.daysWorked) || 0,
                    totalCost: parseFloat(l.totalCost) || 0,
                })),
            },
            inputs: {
                create: normalisedInputs,
            },
            otherCosts: {
                create: (body.otherCosts ?? []).filter((o: any) => o.description).map((o: any) => ({
                    description: o.description,
                    amount: parseFloat(o.amount) || 0,
                })),
            },
        },
    });

    for (const input of inventoryDeductions) {
        await prisma.inventoryItem.update({
            where: { id: input.id },
            data: {
                quantity: { decrement: input.quantity },
                notes: `${input.notes ?? ""}\nConsumed ${input.quantity} ${input.unit} by ${activityType} on ${activityDate.toISOString().slice(0, 10)}.`.trim(),
            },
        });
    }

    for (const input of (body.inputs ?? []).filter((item: any) => !item.inventoryItemId)) {
        const quantity = parseFloat(input.quantity) || 0;
        if (!input.inputName || quantity <= 0) continue;

        const inventory = await prisma.inventoryItem.findFirst({
            where: {
                farmId,
                name: { equals: String(input.inputName).trim() },
                unit: input.unit,
                quantity: { gt: 0 },
                category: { in: [input.category, String(input.category).toLowerCase(), "seed", "fertiliser", "fertilizer", "chemical"] },
            },
            orderBy: { createdAt: "asc" },
        });
        if (!inventory) continue;

        await prisma.inventoryItem.update({
            where: { id: inventory.id },
            data: {
                quantity: Math.max(0, inventory.quantity - quantity),
                notes: `${inventory.notes ?? ""}\nConsumed ${quantity} ${input.unit} by ${activityType} on ${activityDate.toISOString().slice(0, 10)}.`.trim(),
            },
        });
    }

    return NextResponse.json({ id: activity.id }, { status: 201 });
}
