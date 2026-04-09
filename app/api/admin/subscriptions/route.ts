import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscriptions = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
            tier: true,
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
    });

    return NextResponse.json(subscriptions.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        tierName: s.tier.name,
        tierId: s.tierId,
        status: s.status,
        billingCycle: s.billingCycle,
        startDate: s.startDate,
        endDate: s.endDate,
        lastPayment: s.payments[0] ?? null,
        notes: s.notes,
    })));
}