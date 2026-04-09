import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                farms: {
                    create: {
                        name: `${name}'s Farm`,
                        location: "Not set",
                    },
                },
            },
        });

        // After user creation, add:
        const freeTier = await prisma.subscriptionTier.findFirst({
            where: { name: "Free" },
        });

        if (freeTier) {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    tierId: freeTier.id,
                    status: "active",
                    billingCycle: "monthly",
                },
            });
        }

        return NextResponse.json({ message: "Account created", userId: user.id });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}