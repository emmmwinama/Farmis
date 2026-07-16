import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const tiers = await prisma.subscriptionTier.findMany({
            where:   { isActive: true, isPublic: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id:                    true,
                name:                  true,
                description:           true,
                priceMonthly:          true,
                priceAnnual:           true,
                isFeatured:            true,
                isActive:              true,
                sortOrder:             true,
                maxFields:             true,
                maxCrops:              true,
                maxActivities:         true,
                maxTransactions:       true,
                maxEmployees:          true,
                maxTeamMembers:        true,
                maxFarms:              true,
                seasonAnalytics:       true,
                yieldSuggestions:      true,
                costPerHectare:        true,
                payrollTracking:       true,
                multipleFarms:         true,
                teamAccounts:          true,
                customReports:         true,
                apiAccess:             true,
                dataRetentionLifetime: true,
            },
        });
        return NextResponse.json(tiers);
    } catch (err) {
        console.error("Public tiers error:", err);
        return NextResponse.json([], { status: 200 });
    }
}
