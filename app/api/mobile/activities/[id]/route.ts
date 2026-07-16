import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activity = await prisma.farmActivity.findFirst({
        where: {
            id:    params.id,
            field: { farmId: session.farmId },
        },
        include: {
            field:    true,
            cropField: { include: { cropType: true } },
            inputs:    true,
            labourRecords: {
                include: { employee: true },
            },
            otherCosts: true,
        },
    });

    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    const totalInputCost  = activity.inputs.reduce((s, i) => s + i.totalCost, 0);
    const totalLabourCost = activity.labourRecords.reduce((s, l) => s + l.totalCost, 0);
    const totalOtherCost  = activity.otherCosts.reduce((s, o) => s + o.amount, 0);

    return NextResponse.json({
        id:           activity.id,
        activityType: activity.activityType,
        date:         activity.date,
        notes:        activity.notes,
        fieldId:      activity.fieldId,
        fieldName:    activity.field.name,
        cropFieldId:  activity.cropFieldId,
        cropName:     activity.cropField?.cropType?.name ?? null,
        costs: {
            inputs: totalInputCost,
            labour: totalLabourCost,
            other:  totalOtherCost,
            total:  totalInputCost + totalLabourCost + totalOtherCost,
        },
        inputs: activity.inputs.map((i) => ({
            id:        i.id,
            inputName: i.inputName,
            category:  i.category,
            quantity:  i.quantity,
            unit:      i.unit,
            unitCost:  i.unitCost,
            totalCost: i.totalCost,
        })),
        labourRecords: activity.labourRecords.map((l) => ({
            id:           l.id,
            employeeName: l.employee.name,
            hoursWorked:  l.hoursWorked,
            daysWorked:   l.daysWorked,
            totalCost:    l.totalCost,
        })),
        otherCosts: activity.otherCosts.map((o) => ({
            id:          o.id,
            description: o.description,
            amount:      o.amount,
        })),
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activity = await prisma.farmActivity.findFirst({
        where: {
            id:    params.id,
            field: { farmId: session.farmId },
        },
    });
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    await prisma.farmActivity.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}