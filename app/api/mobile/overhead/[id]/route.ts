import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

function getSession(req: NextRequest) {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), JWT_SECRET) as {
            userId: string; farmId: string;
        };
    } catch { return null; }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getSession(req);
    if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const e = await prisma.overheadExpense.findFirst({
        where: { id: params.id, farmId: session.farmId },
    });
    if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.overheadExpense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}