import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const prices = await prisma.marketPrice.findMany({ orderBy: [{ cropName: "asc" }, { market: "asc" }, { recordedAt: "desc" }] });
    return NextResponse.json(prices);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const price = await prisma.marketPrice.create({ data: { ...body, source: body.source ?? "ADMARC" } });
    return NextResponse.json(price, { status: 201 });
}