import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        recentPayments,
        subsByTier,
        recentUsers,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.subscription.count({ where: { status: "active" } }),
        prisma.payment.aggregate({
            where: { status: "paid" },
            _sum: { amount: true },
        }),
        prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { subscription: { include: { user: true, tier: true } } },
        }),
        prisma.subscription.groupBy({
            by: ["tierId"],
            _count: {_all: true},
            // include: { tier: true } as any,
        }),
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { subscription: { include: { tier: true } } },
        }),
    ]);

    const tiers = await prisma.subscriptionTier.findMany();
    const tierMap = Object.fromEntries(tiers.map((t) => [t.id, t.name]));

    return NextResponse.json({
        totalUsers,
        activeSubscriptions,
        totalRevenue: totalRevenue._sum.amount ?? 0,
        recentPayments: recentPayments.map((p) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            method: p.method,
            paidAt: p.paidAt,
            userName: p.subscription.user.name,
            tierName: p.subscription.tier.name,
        })),
        subsByTier: subsByTier.map((s) => ({
            tierName: tierMap[s.tierId] ?? s.tierId,
            count: s._count._all,
        })),
        recentUsers: recentUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            tierName: u.subscription?.tier?.name ?? "No subscription",
            subscriptionStatus: u.subscription?.status ?? null,
        })),
    });
}