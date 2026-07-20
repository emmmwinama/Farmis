import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";
import { requireFarmPermission } from "@/lib/roleAccess";

function aggregateByType(activities: any[]) {
    const map: Record<string, { count: number; totalCost: number }> = {};
    for (const a of activities) {
        if (!map[a.activityType]) map[a.activityType] = { count: 0, totalCost: 0 };
        map[a.activityType].count += 1;
        map[a.activityType].totalCost += a.totalCost;
    }
    return Object.entries(map)
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.count - a.count);
}

function aggregateByField(activities: any[]) {
    const map: Record<string, { name: string; count: number; totalCost: number }> = {};
    for (const a of activities) {
        if (!map[a.fieldId]) map[a.fieldId] = { name: a.fieldName, count: 0, totalCost: 0 };
        map[a.fieldId].count += 1;
        map[a.fieldId].totalCost += a.totalCost;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
}

function aggregateBySeason(activities: any[]) {
    const map: Record<string, { count: number; totalCost: number; types: string[] }> = {};
    for (const a of activities) {
        const season = a.season ?? "No season";
        if (!map[season]) map[season] = { count: 0, totalCost: 0, types: [] };
        map[season].count += 1;
        map[season].totalCost += a.totalCost;
        if (!map[season].types.includes(a.activityType)) map[season].types.push(a.activityType);
    }
    return Object.entries(map)
        .map(([season, data]) => ({ season, ...data }))
        .sort((a, b) => b.season.localeCompare(a.season));
}

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

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId");
    const type = searchParams.get("type");
    const season = searchParams.get("season");
    const cropState = searchParams.get("cropState") ?? "active";

    const fieldIds = (
        await prisma.field.findMany({
            where: { farmId: farm.id },
            select: { id: true },
        })
    ).map((f) => f.id);

    const activities = await prisma.farmActivity.findMany({
        where: {
            fieldId: fieldId ? fieldId : { in: fieldIds },
            ...(type ? { activityType: type } : {}),
            ...(season ? { cropField: { season } } : {}),
            ...(cropState === "active"
                ? { OR: [{ cropFieldId: null }, { cropField: { isArchived: false, status: { not: "Harvested" } } }] }
                : cropState === "archived"
                    ? { cropField: { OR: [{ isArchived: true }, { status: "Harvested" }] } }
                    : {}),
        },
        include: {
            field: true,
            cropField: { include: { cropType: true } },
            responsibleEmployee: true,
            labourRecords: { include: { employee: true } },
            inputs: true,
            otherCosts: true,
        },
        orderBy: { date: "desc" },
    });

    const result = activities.map((a) => {
        const noteData = unpackNotes(a.notes);
        return ({
        id: a.id,
        activityType: a.activityType,
        date: a.date,
        notes: noteData.notes,
        responsiblePersonName: a.responsiblePersonName ?? noteData.responsiblePersonName,
        fieldId: a.fieldId,
        fieldName: a.field.name,
        cropFieldId: a.cropFieldId,
        cropName: a.cropField?.cropType?.name ?? null,
        cropVariety: a.cropField?.variety ?? null,
        season: a.cropField?.season ?? null,
        cropStatus: a.cropField?.status ?? null,
        cropArchived: a.cropField?.isArchived ?? false,
        responsibleEmployee: a.responsibleEmployee
            ? { id: a.responsibleEmployee.id, name: a.responsibleEmployee.name, role: a.responsibleEmployee.role }
            : null,
        labourRecords: a.labourRecords.map((l) => ({
            id: l.id,
            employeeName: l.employee.name,
            hoursWorked: l.hoursWorked,
            daysWorked: l.daysWorked,
            totalCost: l.totalCost,
        })),
        inputs: a.inputs.map((i) => ({
            id: i.id,
            inputName: i.inputName,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            unitCost: i.unitCost,
            totalCost: i.totalCost,
            acquisitionUnitCost: i.acquisitionUnitCost,
            timeValueCost: i.timeValueCost,
            inventoryItemId: i.inventoryItemId,
        })),
        otherCosts: a.otherCosts.map((o) => ({
            id: o.id,
            description: o.description,
            amount: o.amount,
        })),
        totalLabourCost: a.labourRecords.reduce((s, l) => s + l.totalCost, 0),
        totalInputCost: a.inputs.reduce((s, i) => s + i.totalCost, 0),
        totalOtherCost: a.otherCosts.reduce((s, o) => s + o.amount, 0),
        totalCost:
            a.labourRecords.reduce((s, l) => s + l.totalCost, 0) +
            a.inputs.reduce((s, i) => s + i.totalCost, 0) +
            a.otherCosts.reduce((s, o) => s + o.amount, 0),
    });
    });

    const allSeasons = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "desc" },
    });

    return NextResponse.json({
        activities: result,
        allSeasons: allSeasons.map((s) => s.season),
        allFields: await prisma.field.findMany({
            where: { farmId: farm.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        byType: aggregateByType(result),
        byField: aggregateByField(result),
        bySeason: aggregateBySeason(result),
    });
}

export async function POST(req: Request) {
    const access = await requireFarmPermission("activities", "write");
    if (access.error) return access.error;
    const { user, farm } = access;

    try {
        await checkLimit(user.id, "Activities");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const {
        fieldId, cropFieldId, activityType, date,
        notes, responsibleEmployeeId, responsiblePersonName, labourRecords, inputs, otherCosts,
    } = body;

    if (!fieldId || !activityType || !date) {
        return NextResponse.json({ error: "Field, activity type and date are required" }, { status: 400 });
    }

    const activityDate = new Date(date);
    if (Number.isNaN(activityDate.getTime())) {
        return NextResponse.json({ error: "Activity date must be a valid date" }, { status: 400 });
    }

    const field = await prisma.field.findFirst({ where: { id: fieldId, farmId: farm.id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    let cropField = null;
    if (cropFieldId) {
        cropField = await prisma.cropField.findFirst({
            where: { id: cropFieldId, field: { farmId: farm.id } },
        });
        if (!cropField) return NextResponse.json({ error: "Crop record not found" }, { status: 404 });
        if (activityDate < cropField.plantingDate || activityDate > cropField.expectedHarvestDate) {
            return NextResponse.json(
                { error: "Activity date must fall within the crop planting and expected harvest window" },
                { status: 400 }
            );
        }
    }

    const duplicate = await prisma.farmActivity.findFirst({
        where: {
            fieldId,
            cropFieldId: cropFieldId || null,
            activityType,
            date: activityDate,
            createdById: user.id,
        },
    });
    if (duplicate) {
        return NextResponse.json({ error: "A matching activity record already exists" }, { status: 409 });
    }

    const normalisedInputs = [];
    const inventoryDeductions: Array<{ id: string; quantity: number; unit: string; name: string; notes: string | null }> = [];

    for (const rawInput of inputs ?? []) {
        const quantity = parseFloat(rawInput.quantity) || 0;
        if ((!rawInput.inputName && !rawInput.inventoryItemId) || quantity <= 0) continue;

        if (rawInput.inventoryItemId) {
            const inventory = await prisma.inventoryItem.findFirst({
                where: { id: rawInput.inventoryItemId, farmId: farm.id },
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
            inventoryDeductions.push({ id: inventory.id, quantity, unit: inventory.unit, name: inventory.name, notes: inventory.notes });
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
            cropFieldId: cropFieldId || null,
            activityType,
            date: activityDate,
            notes: notes || "",
            responsibleEmployeeId: responsibleEmployeeId || null,
            responsiblePersonName: responsibleEmployeeId ? null : String(responsiblePersonName ?? "").trim() || null,
            createdById: user.id,
            labourRecords: {
                create: (labourRecords ?? []).map((l: any) => ({
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
                create: (otherCosts ?? []).map((o: any) => ({
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
                notes: `${input.notes ?? ""}\nConsumed ${input.quantity} ${input.unit} by ${activityType} on ${new Date(date).toISOString().slice(0, 10)}.`.trim(),
            },
        });
    }

    for (const input of (inputs ?? []).filter((item: any) => !item.inventoryItemId)) {
        const quantity = parseFloat(input.quantity) || 0;
        if (!input.inputName || quantity <= 0) continue;

        const inventory = await prisma.inventoryItem.findFirst({
            where: {
                farmId: farm.id,
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
                notes: `${inventory.notes ?? ""}\nConsumed ${quantity} ${input.unit} by ${activityType} on ${new Date(date).toISOString().slice(0, 10)}.`.trim(),
            },
        });
    }

    return NextResponse.json(activity, { status: 201 });
}
