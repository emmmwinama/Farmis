import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "farmio-mobile-secret-key-2024";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
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
        const token = jwt.sign(
            {
                userId: user.id,
                email:  user.email,
                farmId: farm?.id ?? null,
                role:   user.role,
            },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

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