import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const types = await prisma.livestockType.findMany({
        where: { farmId: farm.id },
        include: { _count: { select: { animals: true } } },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(types);
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, category, icon } = body;

    if (!name || !category) {
        return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    const type = await prisma.livestockType.create({
        data: { farmId: farm.id, name, category, icon: icon ?? "🐄" },
    });

    return NextResponse.json(type, { status: 201 });
}