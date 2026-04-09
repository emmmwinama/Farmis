import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";

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

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId");
    const type = searchParams.get("type");
    const season = searchParams.get("season");

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

    const result = activities.map((a) => ({
        id: a.id,
        activityType: a.activityType,
        date: a.date,
        notes: a.notes,
        fieldId: a.fieldId,
        fieldName: a.field.name,
        cropFieldId: a.cropFieldId,
        cropName: a.cropField?.cropType?.name ?? null,
        cropVariety: a.cropField?.variety ?? null,
        season: a.cropField?.season ?? null,
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
    }));

    const allSeasons = await prisma.cropField.findMany({
        where: { field: { farmId: farm.id } },
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "desc" },
    });

    return NextResponse.json({
        activities: result,
        allSeasons: allSeasons.map((s) => s.season),
        byType: aggregateByType(result),
        byField: aggregateByField(result),
        bySeason: aggregateBySeason(result),
    });
}

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(user.id, "Activities");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const {
        fieldId, cropFieldId, activityType, date,
        notes, responsibleEmployeeId, labourRecords, inputs, otherCosts,
    } = body;

    if (!fieldId || !activityType || !date) {
        return NextResponse.json({ error: "Field, activity type and date are required" }, { status: 400 });
    }

    const activity = await prisma.farmActivity.create({
        data: {
            fieldId,
            cropFieldId: cropFieldId || null,
            activityType,
            date: new Date(date),
            notes: notes || "",
            responsibleEmployeeId: responsibleEmployeeId || null,
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
                create: (inputs ?? []).map((i: any) => ({
                    inputName: i.inputName,
                    category: i.category,
                    quantity: parseFloat(i.quantity) || 0,
                    unit: i.unit,
                    unitCost: parseFloat(i.unitCost) || 0,
                    totalCost: (parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0),
                })),
            },
            otherCosts: {
                create: (otherCosts ?? []).map((o: any) => ({
                    description: o.description,
                    amount: parseFloat(o.amount) || 0,
                })),
            },
        },
    });

    return NextResponse.json(activity, { status: 201 });
}