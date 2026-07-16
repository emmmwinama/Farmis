import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminToken } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`admin-login:${ip}`, 5, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { email, password } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!normalizedEmail || typeof password !== "string") {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
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
            sameSite: "strict",
            maxAge:   60 * 60 * 24,
            path:     "/",
        });

        return res;
    } catch (err: any) {
        console.error("Admin login error:", err?.message ?? err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
