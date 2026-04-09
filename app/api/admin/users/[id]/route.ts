import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { isActive, tierId, subscriptionStatus, endDate, billingCycle } = body;

    if (isActive !== undefined) {
        await prisma.user.update({ where: { id: params.id }, data: { isActive } });
    }

    const sub = await prisma.subscription.findUnique({ where: { userId: params.id } });

    if (tierId || subscriptionStatus || endDate || billingCycle) {
        if (sub) {
            await prisma.subscription.update({
                where: { userId: params.id },
                data: {
                    ...(tierId ? { tierId } : {}),
                    ...(subscriptionStatus ? { status: subscriptionStatus } : {}),
                    ...(endDate ? { endDate: new Date(endDate) } : {}),
                    ...(billingCycle ? { billingCycle } : {}),
                },
            });
        } else if (tierId) {
            await prisma.subscription.create({
                data: { userId: params.id, tierId, status: "active", billingCycle: billingCycle ?? "monthly" },
            });
        }
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}