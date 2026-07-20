import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

function hasSelection(...values: Array<string | null>) {
    return values.some((value) => value && value !== "All");
}

export async function GET(req: NextRequest) {
    try {
        const session = getMobileSession(req);
        if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") ?? "This year";
        const crop = searchParams.get("crop");
        const season = searchParams.get("season");

        const now = new Date();
        let from: Date | undefined;
        let to: Date | undefined = now;

        if (searchParams.get("from")) from = new Date(searchParams.get("from")!);
        if (searchParams.get("to")) to = new Date(searchParams.get("to")!);

        if (!from || Number.isNaN(from.getTime())) {
            if (period === "Today") {
                from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (period === "This week") {
                const day = now.getDay() || 7;
                from = new Date(now);
                from.setDate(now.getDate() - day + 1);
                from.setHours(0, 0, 0, 0);
            } else if (period === "This year") {
                from = new Date(now);
                from.setDate(now.getDate() - 365);
                from.setHours(0, 0, 0, 0);
            } else if (period === "This season") {
                from = new Date(now.getFullYear(), 0, 1);
            } else {
                from = new Date(now.getFullYear(), now.getMonth(), 1);
            }
        }
        if (!to || Number.isNaN(to.getTime())) {
            to = now;
        } else {
            to.setHours(23, 59, 59, 999);
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                farms: {
                    include: {
                        fields: { include: { cropFields: { include: { cropType: true } } } },
                        employees: true,
                    },
                },
            },
        });

        if (!user || user.farms.length === 0) {
            return NextResponse.json({ error: "No farm found" }, { status: 404 });
        }

        const farm = user.farms.find((f) => f.id === session.farmId) ?? user.farms[0];

        const selectedCropFields = farm.fields.flatMap((field) =>
            field.cropFields.filter((cropField) => {
                if (
                    crop &&
                    crop !== "All" &&
                    cropField.cropTypeId !== crop &&
                    cropField.cropType.name !== crop
                ) return false;
                if (season && season !== "All" && cropField.season !== season) return false;
                return true;
            })
        );
        const selectedFieldIds = new Set(selectedCropFields.map((cropField) => cropField.fieldId));
        const selectedFields = hasSelection(crop, season)
            ? farm.fields.filter((field) => selectedFieldIds.has(field.id))
            : farm.fields;
        const totalFields    = selectedFields.length;
        const totalArea      = selectedFields.reduce((s, f) => s + f.totalArea, 0);
        const activeCrops    = selectedCropFields.filter((c) => c.status === "Active").length;
        const activeEmployees = farm.employees.filter((e) => e.isActive).length;
        const totalEmployees  = farm.employees.length;
        const seasons = [
            ...new Set(
                farm.fields
                    .flatMap((f) => f.cropFields)
                    .map((c) => c.season)
                    .filter((value): value is string => Boolean(value))
            ),
        ].sort((a, b) => b.localeCompare(a));

        const cropFields = selectedCropFields;
        const cropFieldIds = cropFields.map((cropField) => cropField.id);
        const hasCropFieldFilter =
            (crop && crop !== "All") || (season && season !== "All");

        const transactions = await prisma.transaction.findMany({
            where: {
                farmId: farm.id,
                date: { gte: from, lte: to },
                ...(season && season !== "All" ? { season } : {}),
                ...(hasCropFieldFilter ? { cropFieldId: { in: cropFieldIds } } : {}),
            },
        }).catch((error) => {
            console.error("[mobile/dashboard] transactions", error);
            return [];
        });

        const activities = await prisma.farmActivity.findMany({
            where: {
                ...(hasCropFieldFilter ? { cropFieldId: { in: cropFieldIds } } : {}),
                fieldId: { in: farm.fields.map((f) => f.id) },
                date: { gte: from, lte: to },
            },
            select: { id: true },
        }).catch((error) => {
            console.error("[mobile/dashboard] activities", error);
            return [];
        });
        const activityIds = activities.map((activity) => activity.id);

        const labourRecords = activityIds.length > 0
            ? await (prisma as any).activityLabour.findMany({
                where: { activityId: { in: activityIds } },
                select: { totalCost: true },
            }).catch((error: unknown) => {
                console.error("[mobile/dashboard] labourRecords", error);
                return [];
            })
            : [];

        const activityInputs = activityIds.length > 0
            ? await (prisma as any).activityInput.findMany({
                where: { activityId: { in: activityIds } },
                select: { totalCost: true },
            }).catch((error: unknown) => {
                console.error("[mobile/dashboard] activityInputs", error);
                return [];
            })
            : [];

        const activityOtherCosts = activityIds.length > 0
            ? await (prisma as any).activityOtherCost.findMany({
                where: { activityId: { in: activityIds } },
                select: { amount: true },
            }).catch((error: unknown) => {
                console.error("[mobile/dashboard] activityOtherCosts", error);
                return [];
            })
            : [];

        const overheadDelegate = (prisma as any).overheadExpense;
        const overhead: Array<{ amount: number }> = overheadDelegate?.findMany
            ? await overheadDelegate.findMany({
                where: {
                    farmId: farm.id,
                    date: { gte: from, lte: to },
                },
            }).catch((error: unknown) => {
                console.error("[mobile/dashboard] overhead", error);
                return [];
            })
            : [];

        const income  = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
        const transactionExpense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
        const labourExpense = labourRecords.reduce((s: number, l: any) => s + (l.totalCost ?? 0), 0);
        const inputExpense = activityInputs.reduce((s: number, i: any) => s + (i.totalCost ?? 0), 0);
        const otherActivityExpense = activityOtherCosts.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
        const overheadExpense = overhead.reduce((s, e) => s + e.amount, 0);
        const expense = transactionExpense + labourExpense + inputExpense + otherActivityExpense + overheadExpense;
        const expenseBreakdown = [
            { label: "Finance transactions", amount: transactionExpense },
            { label: "Labour", amount: labourExpense },
            { label: "Inputs", amount: inputExpense },
            { label: "Other activity costs", amount: otherActivityExpense },
            { label: "Overhead", amount: overheadExpense },
        ];

        const fieldLandUse = farm.fields.map((f) => ({
            name:             f.name,
            cultivatableArea: f.cultivatableArea,
            allocated:        f.cropFields
                .filter((c) => c.status === "Active")
                .reduce((s, c) => s + c.areaPlanted, 0),
        }));

        const recentActivities = await prisma.farmActivity.findMany({
            where:   { fieldId: { in: farm.fields.map((f) => f.id) } },
            include: { field: true, cropField: { include: { cropType: true } } },
            orderBy: { date: "desc" },
            take:    5,
        }).catch((error) => {
            console.error("[mobile/dashboard] recentActivities", error);
            return [];
        });

        return NextResponse.json({
            farmName:        farm.name,
            userName:        user.name,
            totalFields,
            totalArea,
            activeCrops,
            activeEmployees,
            totalEmployees,
            seasons,
            income,
            expense,
            expenseBreakdown,
            net:             income - expense,
            fieldLandUse,
            recentActivities: recentActivities.map((a) => ({
                id:           a.id,
                activityType: a.activityType,
                fieldName:    a.field.name,
                cropName:     a.cropField?.cropType?.name ?? null,
                date:         a.date,
            })),
        });
    } catch (error) {
        console.error("[mobile/dashboard]", error);
        return NextResponse.json({ error: "Could not load dashboard" }, { status: 500 });
    }
}
