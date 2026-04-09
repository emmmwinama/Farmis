import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const sub = await prisma.subscription.update({
        where: { id: params.id },
        data: {
            ...(body.status ? { status: body.status } : {}),
            ...(body.tierId ? { tierId: body.tierId } : {}),
            ...(body.endDate !== undefined ? { endDate: body.endDate ? new Date(body.endDate) : null } : {}),
            ...(body.billingCycle ? { billingCycle: body.billingCycle } : {}),
            ...(body.notes !== undefined ? { notes: body.notes } : {}),
        },
    });
    return NextResponse.json(sub);
}