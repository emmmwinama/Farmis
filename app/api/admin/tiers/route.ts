import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tiers = await prisma.subscriptionTier.findMany({
        orderBy: { priceMonthly: "asc" },
        include: { _count: { select: { subscriptions: true } } },
    });

    return NextResponse.json(tiers);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const tier = await prisma.subscriptionTier.create({ data: body });
    return NextResponse.json(tier, { status: 201 });
}