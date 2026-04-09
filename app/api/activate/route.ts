import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { activationToken: token } });
    if (!user) return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 400 });

    return NextResponse.json({ name: user.name, email: user.email });
}

export async function POST(req: Request) {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { activationToken: token } });
    if (!user) return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashed,
            isActive: true,
            activationToken: null,
        },
    });

    return NextResponse.json({ success: true });
}