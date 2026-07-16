import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const status = await getSubscriptionStatus(user.id);
  const tier = status.tier;

  return NextResponse.json({
    active: status.active,
    status: status.status ?? null,
    daysRemaining: status.daysRemaining,
    tier: tier
      ? {
          name: tier.name,
          limits: {
            maxFields: tier.maxFields,
            maxCrops: tier.maxCrops,
            maxActivities: tier.maxActivities,
            maxTransactions: tier.maxTransactions,
            maxEmployees: tier.maxEmployees,
            maxFarms: tier.maxFarms,
            maxTeamMembers: tier.maxTeamMembers,
          },
          features: {
            seasonAnalytics: tier.seasonAnalytics,
            yieldSuggestions: tier.yieldSuggestions,
            costPerHectare: tier.costPerHectare,
            payrollTracking: tier.payrollTracking,
            multipleFarms: tier.multipleFarms,
            teamAccounts: tier.teamAccounts,
            customReports: tier.customReports,
            apiAccess: tier.apiAccess,
            dataRetentionLifetime: tier.dataRetentionLifetime,
          },
        }
      : null,
  });
}
