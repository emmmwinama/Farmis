import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

function getSession(req: NextRequest) {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), JWT_SECRET) as {
            userId: string; farmId: string; email: string; role: string;
        };
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const session = getSession(req);
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

        return {
            id:           a.id,
            activityType: a.activityType,
            date:         a.date,
            notes:        a.notes,
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
    const session = getSession(req);
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fieldId, cropFieldId, activityType, date, notes } = body;

    if (!fieldId || !activityType || !date)
        return NextResponse.json(
            { error: "fieldId, activityType and date are required" },
            { status: 400 }
        );

    const field = await prisma.field.findFirst({
        where: { id: fieldId, farmId: session.farmId },
    });
    if (!field)
        return NextResponse.json({ error: "Field not found" }, { status: 404 });

    const activity = await prisma.farmActivity.create({
        data: {
            fieldId,
            cropFieldId: cropFieldId ?? null,
            activityType,
            date:        new Date(date),
            notes:       notes ?? null,
            createdById: session.userId,
        },
    });

    if (body.inputs?.length) {
        await prisma.activityInput.createMany({
            data: body.inputs.map((i: any) => ({
                activityId: activity.id,
                inputName:  i.inputName,
                category:   i.category,
                quantity:   parseFloat(i.quantity),
                unit:       i.unit,
                unitCost:   parseFloat(i.unitCost),
                totalCost:  parseFloat(i.quantity) * parseFloat(i.unitCost),
            })),
        });
    }

    if (body.otherCosts?.length) {
        await prisma.activityOtherCost.createMany({
            data: body.otherCosts.map((o: any) => ({
                activityId:  activity.id,
                description: o.description,
                amount:      parseFloat(o.amount),
            })),
        });
    }

    return NextResponse.json({ id: activity.id }, { status: 201 });
}