import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cropTypes = await prisma.cropType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(cropTypes);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const existing = await prisma.cropType.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ error: "Crop type already exists" }, { status: 400 });

    const cropType = await prisma.cropType.create({ data: { name, isCustom: true } });
    return NextResponse.json(cropType, { status: 201 });
}