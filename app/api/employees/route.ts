import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";
import { checkLimit } from "@/lib/subscription";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employees = await prisma.employee.findMany({
        where: { farmId: farm.id },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
}

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await checkLimit(user.id, "Employees");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, role, payRate, payRateUnit, phone } = body;

    if (!name || !role || !payRate || !payRateUnit) {
        return NextResponse.json(
            { error: "Name, role, pay rate and pay rate unit are required" },
            { status: 400 }
        );
    }

    const employee = await prisma.employee.create({
        data: {
            farmId: farm.id,
            name,
            role,
            payRate: parseFloat(payRate),
            payRateUnit,
            phone: phone ?? "",
        },
    });

    return NextResponse.json(employee, { status: 201 });
}