import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getTrialEndDate } from "@/lib/tiers";

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`register:${ip}`, 5, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { name, email, password } = await req.json();
        const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";

        if (!cleanName || !cleanEmail || typeof password !== "string") {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                password: hashed,
                farms: {
                    create: {
                        name: `${cleanName}'s Farm`,
                        location: "Not set",
                    },
                },
            },
        });

        // After user creation, add:
        const trialTier =
            await prisma.subscriptionTier.findFirst({ where: { name: "Trial" } }) ??
            await prisma.subscriptionTier.findFirst({
                where: { priceMonthly: 0, isActive: true },
                orderBy: { sortOrder: "asc" },
            });

        if (trialTier) {
            const trialEndsAt = getTrialEndDate();
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    tierId: trialTier.id,
                    status: "trial",
                    billingCycle: "monthly",
                    endDate: trialEndsAt,
                    trialEndsAt,
                },
            });
        }

        return NextResponse.json({ message: "Account created", userId: user.id });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
