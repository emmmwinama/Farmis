import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { normalizeTierInput } from "@/lib/tiers";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tiers = await prisma.subscriptionTier.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { subscriptions: true } } },
    });

    return NextResponse.json(tiers);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    try {
        const data = normalizeTierInput(body);
        if (!data.name) return NextResponse.json({ error: "Tier name is required" }, { status: 400 });

        const tier = await prisma.subscriptionTier.create({
            data,
        });
        return NextResponse.json(tier, { status: 201 });
    } catch (err: any) {
        console.error("Tier POST error:", err.message);
        return NextResponse.json({ error: err.message ?? "Create failed" }, { status: 500 });
    }
}
