import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        const payment = await prisma.payment.update({
            where: { id: params.id },
            data: {
                ...(body.status    !== undefined ? { status:    body.status }              : {}),
                ...(body.amount    !== undefined ? { amount:    parseFloat(body.amount) }  : {}),
                ...(body.method    !== undefined ? { method:    body.method }              : {}),
                ...(body.reference !== undefined ? { reference: body.reference }           : {}),
                ...(body.notes     !== undefined ? { notes:     body.notes }               : {}),
                ...(body.paidAt    !== undefined ? { paidAt:    new Date(body.paidAt) }    : {}),
            },
        });

        return NextResponse.json(payment);
    } catch (err: any) {
        console.error("Admin payments PATCH error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.payment.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Admin payments DELETE error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}