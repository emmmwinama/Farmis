import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch payments with only scalar fields — no nested relations
        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id:             true,
                amount:         true,
                currency:       true,
                status:         true,
                method:         true,
                reference:      true,
                notes:          true,
                paidAt:         true,
                createdAt:      true,
                subscriptionId: true,
            },
        });

        // Fetch subscriptions separately
        const subIds = [...new Set(payments.map((p) => p.subscriptionId))];
        const subs = subIds.length > 0
            ? await prisma.subscription.findMany({
                where:  { id: { in: subIds } },
                select: { id: true, tierId: true, userId: true, status: true, billingCycle: true },
            })
            : [];

        // Fetch users and tiers separately
        const userIds = [...new Set(subs.map((s) => s.userId))];
        const tierIds = [...new Set(subs.map((s) => s.tierId))];

        const [users, tiers] = await Promise.all([
            userIds.length > 0
                ? prisma.user.findMany({
                    where:  { id: { in: userIds } },
                    select: { id: true, name: true, email: true },
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
        const subsById  = Object.fromEntries(subs.map((s) => [s.id, s]));

        const result = payments.map((p) => {
            const sub  = subsById[p.subscriptionId]  ?? null;
            const user = sub ? usersById[sub.userId]  ?? null : null;
            const tier = sub ? tiersById[sub.tierId]  ?? null : null;

            return {
                id:           p.id,
                amount:       p.amount,
                currency:     p.currency,
                status:       p.status,
                method:       p.method,
                reference:    p.reference,
                notes:        p.notes,
                paidAt:       p.paidAt ?? p.createdAt,
                createdAt:    p.createdAt,
                userName:     user?.name ?? user?.email ?? "Unknown",
                userEmail:    user?.email ?? "—",
                tierName:     tier?.name ?? "—",
                subStatus:    sub?.status ?? "—",
                billingCycle: sub?.billingCycle ?? "—",
            };
        });

        // Summary stats
        const totalRevenue = payments
            .filter((p) => p.status === "paid")
            .reduce((s, p) => s + p.amount, 0);

        const monthlyRevenue = payments
            .filter((p) => {
                if (p.status !== "paid") return false;
                const d = new Date(p.paidAt ?? p.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((s, p) => s + p.amount, 0);

        return NextResponse.json({ payments: result, totalRevenue, monthlyRevenue });
    } catch (err: any) {
        console.error("Admin payments GET error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { subscriptionId, amount, currency, status, method, reference, notes, paidAt } = body;

        if (!subscriptionId || !amount || !method) {
            return NextResponse.json({ error: "subscriptionId, amount and method are required" }, { status: 400 });
        }

        const payment = await prisma.payment.create({
            data: {
                subscriptionId,
                amount:    parseFloat(amount),
                currency:  currency ?? "MWK",
                status:    status   ?? "paid",
                method,
                reference: reference ?? null,
                notes:     notes    ?? null,
                paidAt:    paidAt   ? new Date(paidAt) : new Date(),
            },
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (err: any) {
        console.error("Admin payments POST error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}