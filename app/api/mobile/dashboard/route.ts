import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

function hasSelection(...values: Array<string | null>) {
    return values.some((value) => value && value !== "All");
}

function periodRange(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "This year";
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

    return { from, to, crop: searchParams.get("crop"), season: searchParams.get("season") };
}

async function fallback<T>(label: string, promise: Promise<T>, value: T) {
    try {
        return await promise;
    } catch (error) {
        console.error(`[mobile/dashboard] ${label}`, error);
        return value;
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = getMobileSession(req);
        if (!session?.farmId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { from, to, crop, season } = periodRange(req);

        const [user, farm] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.userId },
                select: { id: true, name: true },
            }),
            prisma.farm.findUnique({
                where: { id: session.farmId },
                select: {
                    id: true,
                    name: true,
                    fields: {
                        select: {
                            id: true,
                            name: true,
                            totalArea: true,
                            cultivatableArea: true,
                            cropFields: {
                                select: {
                                    id: true,
                                    cropTypeId: true,
                                    fieldId: true,
                                    areaPlanted: true,
                                    season: true,
                                    status: true,
                                    cropType: { select: { name: true } },
                                },
                            },
                        },
                    },
                    employees: {
                        select: { id: true, isActive: true },
                    },
                },
            }),
        ]);

        if (!user || !farm) {
            return NextResponse.json({ error: "No farm found" }, { status: 404 });
        }

        const allCropFields = farm.fields.flatMap((field) => field.cropFields);
        const selectedCropFields = allCropFields.filter((cropField) => {
            if (
                crop &&
                crop !== "All" &&
                cropField.cropTypeId !== crop &&
                cropField.cropType.name !== crop
            ) return false;
            if (season && season !== "All" && cropField.season !== season) return false;
            return true;
        });

        const selectedFieldIds = new Set(selectedCropFields.map((cropField) => cropField.fieldId));
        const selectedFields = hasSelection(crop, season)
            ? farm.fields.filter((field) => selectedFieldIds.has(field.id))
            : farm.fields;
        const selectedCropFieldIds = selectedCropFields.map((cropField) => cropField.id);
        const farmFieldIds = farm.fields.map((field) => field.id);
        const hasCropFieldFilter = hasSelection(crop, season);

        const transactionsPromise = fallback(
            "transactions",
            prisma.transaction.findMany({
                where: {
                    farmId: farm.id,
                    date: { gte: from, lte: to },
                    ...(season && season !== "All" ? { season } : {}),
                    ...(hasCropFieldFilter ? { cropFieldId: { in: selectedCropFieldIds } } : {}),
                },
                select: { type: true, amount: true },
            }),
            []
        );

        const activitiesPromise = fallback(
            "activities",
            prisma.farmActivity.findMany({
                where: {
                    fieldId: { in: farmFieldIds },
                    date: { gte: from, lte: to },
                    ...(hasCropFieldFilter ? { cropFieldId: { in: selectedCropFieldIds } } : {}),
                },
                select: { id: true },
            }),
            []
        );

        const overheadDelegate = (prisma as any).overheadExpense;
        const overheadPromise = overheadDelegate?.findMany
            ? fallback(
                "overhead",
                overheadDelegate.findMany({
                    where: { farmId: farm.id, date: { gte: from, lte: to } },
                    select: { amount: true },
                }),
                []
            )
            : Promise.resolve([]);

        const recentActivitiesPromise = fallback(
            "recentActivities",
            prisma.farmActivity.findMany({
                where: { fieldId: { in: farmFieldIds } },
                include: { field: true, cropField: { include: { cropType: true } } },
                orderBy: { date: "desc" },
                take: 5,
            }),
            []
        );

        const [transactions, activities, overhead, recentActivities] = await Promise.all([
            transactionsPromise,
            activitiesPromise,
            overheadPromise,
            recentActivitiesPromise,
        ]);

        const activityIds = activities.map((activity) => activity.id);
        const [labourRecords, activityInputs, activityOtherCosts] =
            activityIds.length > 0
                ? await Promise.all([
                    fallback(
                        "labourRecords",
                        (prisma as any).activityLabour.findMany({
                            where: { activityId: { in: activityIds } },
                            select: { totalCost: true },
                        }),
                        []
                    ),
                    fallback(
                        "activityInputs",
                        (prisma as any).activityInput.findMany({
                            where: { activityId: { in: activityIds } },
                            select: { totalCost: true },
                        }),
                        []
                    ),
                    fallback(
                        "activityOtherCosts",
                        (prisma as any).activityOtherCost.findMany({
                            where: { activityId: { in: activityIds } },
                            select: { amount: true },
                        }),
                        []
                    ),
                ])
                : [[], [], []];

        const income = transactions
            .filter((transaction) => transaction.type === "Income")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const transactionExpense = transactions
            .filter((transaction) => transaction.type === "Expense")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const labourExpense = labourRecords.reduce(
            (sum: number, item: any) => sum + (item.totalCost ?? 0),
            0
        );
        const inputExpense = activityInputs.reduce(
            (sum: number, item: any) => sum + (item.totalCost ?? 0),
            0
        );
        const otherActivityExpense = activityOtherCosts.reduce(
            (sum: number, item: any) => sum + (item.amount ?? 0),
            0
        );
        const overheadExpense = overhead.reduce(
            (sum: number, item: any) => sum + (item.amount ?? 0),
            0
        );
        const expense =
            transactionExpense +
            labourExpense +
            inputExpense +
            otherActivityExpense +
            overheadExpense;

        const seasons = [
            ...new Set(
                allCropFields
                    .map((cropField) => cropField.season)
                    .filter((value): value is string => Boolean(value))
            ),
        ].sort((a, b) => b.localeCompare(a));

        return NextResponse.json({
            farmName: farm.name,
            userName: user.name,
            totalFields: selectedFields.length,
            totalArea: selectedFields.reduce((sum, field) => sum + field.totalArea, 0),
            activeCrops: selectedCropFields.filter((cropField) => cropField.status === "Active").length,
            activeEmployees: farm.employees.filter((employee) => employee.isActive).length,
            totalEmployees: farm.employees.length,
            seasons,
            income,
            expense,
            expenseBreakdown: [
                { label: "Finance transactions", amount: transactionExpense },
                { label: "Labour", amount: labourExpense },
                { label: "Inputs", amount: inputExpense },
                { label: "Other activity costs", amount: otherActivityExpense },
                { label: "Overhead", amount: overheadExpense },
            ],
            net: income - expense,
            fieldLandUse: selectedFields.map((field) => ({
                name: field.name,
                cultivatableArea: field.cultivatableArea,
                allocated: field.cropFields
                    .filter((cropField) => cropField.status === "Active")
                    .reduce((sum, cropField) => sum + cropField.areaPlanted, 0),
            })),
            recentActivities: recentActivities.map((activity) => ({
                id: activity.id,
                activityType: activity.activityType,
                fieldName: activity.field.name,
                cropName: activity.cropField?.cropType?.name ?? null,
                date: activity.date,
            })),
        });
    } catch (error) {
        console.error("[mobile/dashboard]", error);
        return NextResponse.json({ error: "Could not load dashboard" }, { status: 500 });
    }
}
