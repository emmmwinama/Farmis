import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [
            totalUsers,
            activeSubscriptions,
            recentUsersRaw,
            tiers,
            totalRevenueAgg,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.subscription.count({ where: { status: "active" } }),
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    id:        true,
                    name:      true,
                    email:     true,
                    isActive:  true,
                    createdAt: true,
                    farms:     { select: { name: true }, take: 1 },
                },
            }),
            prisma.subscriptionTier.findMany({
                orderBy: { sortOrder: "asc" },
                select: {
                    id:           true,
                    name:         true,
                    priceMonthly: true,
                    _count:       { select: { subscriptions: true } },
                },
            }),
            prisma.payment.aggregate({
                where: { status: "paid" },
                _sum:  { amount: true },
            }),
        ]);

        // Fetch payments separately without the broken relation
        const recentPaymentsRaw = await prisma.payment.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id:             true,
                amount:         true,
                status:         true,
                paidAt:         true,
                createdAt:      true,
                subscriptionId: true,
            },
        });

        // Fetch subscriptions for those payments separately
        const subIds = recentPaymentsRaw
            .map((p) => p.subscriptionId)
            .filter(Boolean) as string[];

        const subs = subIds.length > 0
            ? await prisma.subscription.findMany({
                where: { id: { in: subIds } },
                include: {
                    user: { select: { name: true, email: true } },
                    tier: { select: { name: true } },
                },
            })
            : [];

        const subsById = Object.fromEntries(subs.map((s) => [s.id, s]));

        const recentPayments = recentPaymentsRaw.map((p) => {
            const sub = subsById[p.subscriptionId ?? ""];
            return {
                id:       p.id,
                amount:   p.amount,
                status:   p.status,
                paidAt:   p.paidAt ?? p.createdAt,
                userName: sub?.user?.name ?? sub?.user?.email ?? "Unknown",
                tierName: sub?.tier?.name ?? "—",
            };
        });

        const recentUsers = recentUsersRaw.map((u) => ({
            id:        u.id,
            name:      u.name ?? u.email,
            email:     u.email,
            isActive:  u.isActive,
            createdAt: u.createdAt,
            farmName:  u.farms[0]?.name ?? null,
        }));

        const subsByTier = tiers.map((t) => ({
            tierName: t.name,
            count:    t._count.subscriptions,
        }));

        return NextResponse.json({
            totalUsers,
            activeSubscriptions,
            totalRevenue: totalRevenueAgg._sum.amount ?? 0,
            recentUsers,
            recentPayments,
            subsByTier,
        });
    } catch (err: any) {
        console.error("Admin overview error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}