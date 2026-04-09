import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            subscription: { include: { user: true, tier: true } },
        },
    });

    return NextResponse.json(payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method,
        reference: p.reference,
        notes: p.notes,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        userName: p.subscription.user.name,
        userEmail: p.subscription.user.email,
        tierName: p.subscription.tier.name,
        subscriptionId: p.subscriptionId,
    })));
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subscriptionId, amount, method, reference, notes, paidAt } = body;

    const payment = await prisma.payment.create({
        data: {
            subscriptionId,
            amount: parseFloat(amount),
            currency: "MWK",
            status: "paid",
            method,
            reference: reference ?? null,
            notes: notes ?? null,
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            createdByAdminId: admin.id,
        },
    });

    // Extend subscription by billing cycle
    const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { tier: true },
    });

    if (sub) {
        const base = sub.endDate && sub.endDate > new Date() ? sub.endDate : new Date();
        const newEnd = new Date(base);
        if (sub.billingCycle === "annual") {
            newEnd.setFullYear(newEnd.getFullYear() + 1);
        } else {
            newEnd.setMonth(newEnd.getMonth() + 1);
        }

        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { endDate: newEnd, status: "active" },
        });
    }

    return NextResponse.json(payment, { status: 201 });
}