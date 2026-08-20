import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const OTP_TTL_MINUTES = 15;

// Always returns a generic success message, whether or not the email is
// registered — otherwise this endpoint becomes an account-enumeration oracle.
export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`forgot-password:${ip}`, 5, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { email } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        const generic = NextResponse.json({
            message: "If that email is registered, we've sent a reset code to it.",
        });

        if (!normalizedEmail) return generic;

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || !user.isActive) return generic;

        const code = crypto.randomInt(100000, 1000000).toString();
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: code,
                resetTokenExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
            },
        });

        await sendEmail(
            normalizedEmail,
            "Your AgriVault password reset code",
            `Your password reset code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.\n\n` +
                `If you didn't request this, you can safely ignore this email.`,
        );

        return generic;
    } catch (error) {
        console.error("[mobile/forgot-password]", error);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
