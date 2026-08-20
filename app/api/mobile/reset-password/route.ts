import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`reset-password:${ip}`, 10, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { email, code, newPassword } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const cleanCode = typeof code === "string" ? code.trim() : "";

        if (!normalizedEmail || !cleanCode || typeof newPassword !== "string") {
            return NextResponse.json({ error: "Email, code and new password are required" }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        const invalid = () => NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

        if (!user || !user.resetToken || !user.resetTokenExpiresAt) return invalid();
        if (user.resetToken !== cleanCode) return invalid();
        if (user.resetTokenExpiresAt < new Date()) return invalid();

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed, resetToken: null, resetTokenExpiresAt: null },
        });

        return NextResponse.json({ message: "Password updated. You can now sign in." });
    } catch (error) {
        console.error("[mobile/reset-password]", error);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
