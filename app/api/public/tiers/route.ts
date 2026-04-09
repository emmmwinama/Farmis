import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const tiers = await prisma.subscriptionTier.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(tiers);
}