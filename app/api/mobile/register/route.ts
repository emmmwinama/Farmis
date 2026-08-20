import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobileAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

// Mirrors /api/register (the web signup flow) but returns a mobile JWT like
// /api/mobile/login, and always lands the new account on "Mobile Free" —
// the mobile app has no plan picker at signup, only an in-app upgrade path.
export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(`mobile-register:${ip}`, 5, 60 * 1000)) {
            return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
        }

        const { name, email, password, farmName } = await req.json();
        const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
        const cleanFarmName = typeof farmName === "string" && farmName.trim()
            ? farmName.trim().slice(0, 120)
            : `${cleanName}'s Farm`;

        if (!cleanName || !cleanEmail || typeof password !== "string") {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                password: hashed,
                farms: { create: { name: cleanFarmName, location: "Not set" } },
            },
            include: { farms: { take: 1, orderBy: { createdAt: "asc" } } },
        });

        const freeTier = await prisma.subscriptionTier.findFirst({
            where: { name: "Mobile Free", isActive: true },
        });

        let tierName: string | null = null;
        if (freeTier) {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    tierId: freeTier.id,
                    status: "active",
                    billingCycle: "monthly",
                    notes: `Signup package: ${freeTier.name}`,
                },
            });
            tierName = freeTier.name;
        }

        const farm = user.farms[0] ?? null;

        const token = signMobileToken({
            userId: user.id,
            email: user.email,
            farmId: farm?.id ?? null,
            role: user.role,
        });

        return NextResponse.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            farm: farm ? { id: farm.id, name: farm.name, location: farm.location } : null,
            subscription: tierName ? { status: "active", tierName } : null,
        });
    } catch (error) {
        console.error("[mobile/register]", error);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
