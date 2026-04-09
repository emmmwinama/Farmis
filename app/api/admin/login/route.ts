import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAdminToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const { email, password } = await req.json();

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signAdminToken(admin.id);

    await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
    });

    const cookieStore = cookies();
    cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
    });

    return NextResponse.json({ success: true, name: admin.name });
}