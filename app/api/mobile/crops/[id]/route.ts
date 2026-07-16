import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

async function verifyCropAccess(cropId: string, farmId: string) {
    return prisma.cropField.findFirst({
        where: {
            id:    cropId,
            field: { farmId },
        },
        include: {
            cropType: true,
            field:    true,
        },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const crop = await verifyCropAccess(params.id, session.farmId);
    if (!crop) return NextResponse.json({ error: "Crop not found" }, { status: 404 });

    const activities = await prisma.farmActivity.findMany({
        where:   { cropFieldId: params.id },
        include: {
            inputs:     true,
            labourRecords: true,
            otherCosts: true,
        },
        orderBy: { date: "desc" },
        take:    10,
    });

    const yields = await prisma.harvestYield.findMany({
        where:   { cropFieldId: params.id },
        orderBy: { harvestDate: "desc" },
    });

    const totalInputCost  = activities.flatMap((a) => a.inputs).reduce((s, i) => s + i.totalCost, 0);
    const totalLabourCost = activities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0);
    const totalOtherCost  = activities.flatMap((a) => a.otherCosts).reduce((s, o) => s + o.amount, 0);

    return NextResponse.json({
        id:                  crop.id,
        cropTypeName:        crop.cropType.name,
        variety:             crop.variety,
        areaPlanted:         crop.areaPlanted,
        season:              crop.season,
        plantingDate:        crop.plantingDate,
        expectedHarvestDate: crop.expectedHarvestDate,
        status:              crop.status,
        fieldId:             crop.field.id,
        fieldName:           crop.field.name,
        costs: {
            inputs:  totalInputCost,
            labour:  totalLabourCost,
            other:   totalOtherCost,
            total:   totalInputCost + totalLabourCost + totalOtherCost,
        },
        yields: yields.map((y) => ({
            id:          y.id,
            harvestDate: y.harvestDate,
            quantity:    y.quantity,
            unit:        y.unit,
            unitWeight:  y.unitWeight,
            notes:       y.notes,
        })),
        activities: activities.map((a) => ({
            id:           a.id,
            activityType: a.activityType,
            date:         a.date,
            notes:        a.notes,
            totalCost:    [
                ...a.inputs.map((i) => i.totalCost),
                ...a.labourRecords.map((l) => l.totalCost),
                ...a.otherCosts.map((o) => o.amount),
            ].reduce((s, v) => s + v, 0),
        })),
    });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const crop = await verifyCropAccess(params.id, session.farmId);
    if (!crop) return NextResponse.json({ error: "Crop not found" }, { status: 404 });

    const body = await req.json();

    // Archive / restore
    if (body.action === "archive") {
        await prisma.cropField.update({
            where: { id: params.id },
            data:  { status: "Archived" },
        });
        return NextResponse.json({ success: true, status: "Archived" });
    }

    if (body.action === "restore") {
        await prisma.cropField.update({
            where: { id: params.id },
            data:  { status: "Active" },
        });
        return NextResponse.json({ success: true, status: "Active" });
    }

    // Regular update
    const updated = await prisma.cropField.update({
        where: { id: params.id },
        data: {
            variety:             body.variety             ?? crop.variety,
            areaPlanted:         body.areaPlanted         ? parseFloat(body.areaPlanted) : crop.areaPlanted,
            season:              body.season              ?? crop.season,
            plantingDate:        body.plantingDate        ? new Date(body.plantingDate)  : crop.plantingDate,
            expectedHarvestDate: body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : crop.expectedHarvestDate,
            status:              body.status              ?? crop.status,
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const crop = await verifyCropAccess(params.id, session.farmId);
    if (!crop) return NextResponse.json({ error: "Crop not found" }, { status: 404 });

    await prisma.cropField.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}