import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobileAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`mobile-login:${ip}`, 10, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { email, password } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!normalizedEmail || typeof password !== "string") {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                farms: {
                    take: 1,
                    orderBy: { createdAt: "asc" },
                },
                subscription: {
                    include: { tier: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: "Your account is not active. Please contact support." },
                { status: 401 }
            );
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const farm = user.farms[0] ?? null;

        // Sign JWT
        const token = signMobileToken({
            userId: user.id,
            email:  user.email,
            farmId: farm?.id ?? null,
            role:   user.role,
        });

        return NextResponse.json({
            token,
            user: {
                id:    user.id,
                name:  user.name,
                email: user.email,
                role:  user.role,
            },
            farm: farm
                ? {
                    id:       farm.id,
                    name:     farm.name,
                    location: farm.location,
                }
                : null,
            subscription: user.subscription
                ? {
                    status:   user.subscription.status,
                    tierName: user.subscription.tier.name,
                }
                : null,
        });

    } catch (error) {
        console.error("[mobile/login]", error);
        return NextResponse.json(
            { error: "Server error. Please try again." },
            { status: 500 }
        );
    }
}
