import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminToken } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = await createAdminToken(admin.id);

        const res = NextResponse.json({ success: true, name: admin.name });
        res.cookies.set("admin_token", token, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge:   60 * 60 * 24,
            path:     "/",
        });

        return res;
    } catch (err: any) {
        console.error("Admin login error:", err?.message ?? err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}