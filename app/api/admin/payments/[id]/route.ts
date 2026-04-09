import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payment = await prisma.payment.update({
        where: { id: params.id },
        data: {
            status: body.status,
            notes: body.notes,
        },
    });
    return NextResponse.json(payment);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.payment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}