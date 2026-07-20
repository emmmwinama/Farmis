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

        const { name, email, password, farmName, tierId, billingCycle, organizationName, phone } = await req.json();
        const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
        const cleanFarmName = typeof farmName === "string" && farmName.trim()
            ? farmName.trim().slice(0, 120)
            : `${cleanName}'s Farm`;

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
                        name: cleanFarmName,
                        location: "Not set",
                    },
                },
            },
        });

        const selectedTier = tierId
            ? await prisma.subscriptionTier.findFirst({
                where: { id: tierId, isActive: true, isPublic: true },
            })
            : null;

        const fallbackTrialTier =
            await prisma.subscriptionTier.findFirst({ where: { name: "Trial", isActive: true } }) ??
            await prisma.subscriptionTier.findFirst({
                where: { priceMonthly: 0, isActive: true },
                orderBy: { sortOrder: "asc" },
            });

        const subscriptionTier = selectedTier ?? fallbackTrialTier;

        if (subscriptionTier) {
            const isTrial = subscriptionTier.priceMonthly === 0 || subscriptionTier.name.toLowerCase().includes("trial");
            const trialEndsAt = getTrialEndDate();
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    tierId: subscriptionTier.id,
                    status: isTrial ? "trial" : "active",
                    billingCycle: billingCycle === "annual" ? "annual" : "monthly",
                    endDate: isTrial ? trialEndsAt : null,
                    trialEndsAt: isTrial ? trialEndsAt : null,
                    notes: [
                        organizationName ? `Organization: ${String(organizationName).trim().slice(0, 160)}` : "",
                        phone ? `Phone: ${String(phone).trim().slice(0, 40)}` : "",
                        `Signup package: ${subscriptionTier.name}`,
                    ].filter(Boolean).join("\n"),
                },
            });
        }

        return NextResponse.json({ message: "Account created", userId: user.id, tierName: subscriptionTier?.name ?? null });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
