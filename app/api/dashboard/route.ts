import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { farms: { include: { fields: { include: { cropFields: true } }, employees: true, transactions: true } } },
    });

    if (!user || user.farms.length === 0) {
        return NextResponse.json({ error: "No farm found" }, { status: 404 });
    }

    const farm = user.farms[0];

    const totalFields = farm.fields.length;
    const totalArea = farm.fields.reduce((s, f) => s + f.totalArea, 0);

    const activeCrops = farm.fields.flatMap((f) =>
        f.cropFields.filter((c) => c.status === "Active")
    ).length;

    const activeEmployees = farm.employees.filter((e) => e.isActive).length;
    const totalEmployees = farm.employees.length;

    const income = farm.transactions
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + t.amount, 0);

    const expense = farm.transactions
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0);

    const fieldLandUse = farm.fields.map((f) => ({
        name: f.name,
        cultivatableArea: f.cultivatableArea,
        allocated: f.cropFields
            .filter((c) => c.status === "Active")
            .reduce((s, c) => s + c.areaPlanted, 0),
    }));

    const recentActivities = await prisma.farmActivity.findMany({
        where: { fieldId: { in: farm.fields.map((f) => f.id) } },
        include: { field: true, cropField: { include: { cropType: true } } },
        orderBy: { date: "desc" },
        take: 5,
    });

    return NextResponse.json({
        farmName: farm.name,
        userName: user.name,
        totalFields,
        totalArea,
        activeCrops,
        activeEmployees,
        totalEmployees,
        income,
        expense,
        net: income - expense,
        fieldLandUse,
        recentActivities: recentActivities.map((a) => ({
            id: a.id,
            activityType: a.activityType,
            fieldName: a.field.name,
            cropName: a.cropField?.cropType?.name ?? null,
            date: a.date,
        })),
    });
}