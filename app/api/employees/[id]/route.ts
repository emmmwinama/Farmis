import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("employees", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const { name, role, payRate, payRateUnit, phone, isActive } = body;

    const existing = await prisma.employee.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const employee = await prisma.employee.update({
        where: { id: params.id },
        data: {
            name,
            role,
            payRate: parseFloat(payRate),
            payRateUnit,
            phone: phone ?? "",
            isActive,
        },
    });

    return NextResponse.json(employee);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("employees", "write");
    if (access.error) return access.error;

    const existing = await prisma.employee.findFirst({
        where: { id: params.id, farmId: access.farm.id },
    });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    await prisma.employee.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
