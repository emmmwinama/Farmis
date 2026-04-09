import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, role, payRate, payRateUnit, phone, isActive } = body;

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.employee.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}