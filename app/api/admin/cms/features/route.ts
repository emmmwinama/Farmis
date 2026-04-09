import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const features = await prisma.cmsFeature.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(features);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const feature = await prisma.cmsFeature.create({ data: body });
    return NextResponse.json(feature, { status: 201 });
}