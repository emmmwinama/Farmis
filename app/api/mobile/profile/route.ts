import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { getAllAccessibleFarms } from "@/lib/farmContext";
import { getSubscriptionStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = getMobileSession(req);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [user, farms, subscription] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            }),
            getAllAccessibleFarms(session.userId),
            getSubscriptionStatus(session.userId),
        ]);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const activeFarm =
            farms.find((farm) => farm.id === session.farmId) ?? farms[0] ?? null;

        return NextResponse.json({
            user,
            farm: activeFarm
                ? {
                    id: activeFarm.id,
                    name: activeFarm.name,
                    location: activeFarm.location ?? "Not set",
                }
                : null,
            farms,
            subscription: subscription.tier
                ? {
                    status: subscription.status ?? "inactive",
                    tierName: subscription.tier.name,
                    daysRemaining: subscription.daysRemaining,
                    viewDaysRemaining: subscription.viewDaysRemaining,
                    active: subscription.active,
                    canView: subscription.canView,
                }
                : null,
        });
    } catch (error) {
        console.error("[mobile/profile]", error);
        return NextResponse.json(
            { error: "Could not load profile" },
            { status: 500 }
        );
    }
}
