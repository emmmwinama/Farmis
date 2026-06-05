import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch subscriptions with only scalar fields
        const subs = await prisma.subscription.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id:           true,
                status:       true,
                billingCycle: true,
                startDate:    true,
                endDate:      true,
                notes:        true,
                createdAt:    true,
                userId:       true,
                tierId:       true,
            },
        });

        // Fetch users and tiers separately to avoid null relation errors
        const userIds = [...new Set(subs.map((s) => s.userId))];
        const tierIds = [...new Set(subs.map((s) => s.tierId))];

        const [users, tiers] = await Promise.all([
            userIds.length > 0
                ? prisma.user.findMany({
                    where:  { id: { in: userIds } },
                    select: { id: true, name: true, email: true, isActive: true },
                })
                : [],
            tierIds.length > 0
                ? prisma.subscriptionTier.findMany({
                    where:  { id: { in: tierIds } },
                    select: { id: true, name: true, priceMonthly: true },
                })
                : [],
        ]);

        const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
        const tiersById = Object.fromEntries(tiers.map((t) => [t.id, t]));

        const result = subs.map((s) => {
            const user = usersById[s.userId] ?? null;
            const tier = tiersById[s.tierId] ?? null;
            return {
                id:           s.id,
                status:       s.status,
                billingCycle: s.billingCycle,
                startDate:    s.startDate,
                endDate:      s.endDate,
                notes:        s.notes,
                createdAt:    s.createdAt,
                userId:       s.userId,
                tierId:       s.tierId,
                userName:     user?.name  ?? null,
                userEmail:    user?.email ?? "—",
                userActive:   user?.isActive ?? false,
                tierName:     tier?.name  ?? "Unknown tier",
                tierPrice:    tier?.priceMonthly ?? 0,
            };
        });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Admin subscriptions GET error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId, tierId, billingCycle, status, endDate, notes } = await req.json();

        if (!userId || !tierId) {
            return NextResponse.json({ error: "userId and tierId required" }, { status: 400 });
        }

        // Upsert — update if exists, create if not
        const existing = await prisma.subscription.findUnique({ where: { userId } });

        if (existing) {
            const updated = await prisma.subscription.update({
                where: { userId },
                data: {
                    tierId,
                    status:       status       ?? "active",
                    billingCycle: billingCycle ?? "monthly",
                    endDate:      endDate ? new Date(endDate) : null,
                    notes:        notes ?? null,
                    startDate:    new Date(),
                },
            });
            return NextResponse.json(updated);
        }

        const sub = await prisma.subscription.create({
            data: {
                userId,
                tierId,
                status:       status       ?? "active",
                billingCycle: billingCycle ?? "monthly",
                endDate:      endDate ? new Date(endDate) : null,
                notes:        notes ?? null,
                startDate:    new Date(),
            },
        });

        return NextResponse.json(sub, { status: 201 });
    } catch (err: any) {
        console.error("Admin subscriptions POST error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}