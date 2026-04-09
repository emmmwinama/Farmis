import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            subscription: { include: { tier: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } } },
            farms: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        activationToken: u.activationToken,
        farmCount: u.farms.length,
        subscription: u.subscription
            ? {
                id: u.subscription.id,
                status: u.subscription.status,
                tierName: u.subscription.tier.name,
                tierId: u.subscription.tierId,
                endDate: u.subscription.endDate,
                billingCycle: u.subscription.billingCycle,
                lastPayment: u.subscription.payments[0] ?? null,
            }
            : null,
    })));
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, tierId, billingCycle, endDate, sendActivation } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);
    const activationToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashed,
            isActive: false,
            activationToken,
            farms: {
                create: { name: `${name}'s Farm`, location: "Not set" },
            },
        },
    });

    if (tierId) {
        await prisma.subscription.create({
            data: {
                userId: user.id,
                tierId,
                status: "active",
                billingCycle: billingCycle ?? "monthly",
                endDate: endDate ? new Date(endDate) : null,
                activationToken,
            },
        });
    }

    const activationLink = `${process.env.NEXTAUTH_URL}/activate?token=${activationToken}`;

    return NextResponse.json({
        success: true,
        userId: user.id,
        activationLink,
        tempPassword: sendActivation ? null : tempPassword,
    }, { status: 201 });
}