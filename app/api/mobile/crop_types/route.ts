import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

function getSession(req: NextRequest) {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const types = await prisma.cropType.findMany({
        orderBy: { name: "asc" },
    });

    return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const existing = await prisma.cropType.findUnique({ where: { name } });
    if (existing) return NextResponse.json(existing);

    const type = await prisma.cropType.create({
        data: { name, isCustom: true },
    });

    return NextResponse.json(type, { status: 201 });
}