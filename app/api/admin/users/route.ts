import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch users without any relations that might be null
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id:              true,
                name:            true,
                email:           true,
                role:            true,
                isActive:        true,
                createdAt:       true,
                subscription:    {
                    select: {
                        id:          true,
                        status:      true,
                        billingCycle: true,
                        startDate:   true,
                        endDate:     true,
                        tierId:      true,  // just the ID, not the relation
                    },
                },
                farms: { select: { id: true, name: true } },
                _count: { select: { farms: true } },
            },
        });

        // Fetch all tiers separately so we can join safely
        const tiers = await prisma.subscriptionTier.findMany({
            select: { id: true, name: true, priceMonthly: true },
        });
        const tiersById = Object.fromEntries(tiers.map((t) => [t.id, t]));

        const result = users.map((u) => ({
            id:           u.id,
            name:         u.name ?? "",
            email:        u.email,
            role:         u.role,
            isActive:     u.isActive,
            createdAt:    u.createdAt,
            farmCount:    u._count.farms,
            farms:        u.farms,
            subscription: u.subscription
                ? {
                    id:          u.subscription.id,
                    status:      u.subscription.status,
                    billingCycle: u.subscription.billingCycle,
                    startDate:   u.subscription.startDate,
                    endDate:     u.subscription.endDate,
                    tier:        tiersById[u.subscription.tierId] ?? null,
                }
                : null,
        }));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Admin users GET error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, email, password, role } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        const bcrypt = await import("bcryptjs");
        const user = await prisma.user.create({
            data: {
                name:     name || null,
                email,
                password: await bcrypt.hash(password, 10),
                role:     role || "user",
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (err: any) {
        console.error("Admin users POST error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}