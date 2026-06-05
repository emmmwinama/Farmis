import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    try {
        const tier = await prisma.subscriptionTier.update({
            where: { id: params.id },
            data: {
                name:                  body.name,
                description:           body.description           ?? null,
                priceMonthly:          Number(body.priceMonthly   ?? 0),
                priceAnnual:           body.priceAnnual != null ? Number(body.priceAnnual) : null,
                maxFields:             Number(body.maxFields       ?? -1),
                maxCrops:              Number(body.maxCrops        ?? -1),
                maxActivities:         Number(body.maxActivities   ?? -1),
                maxTransactions:       Number(body.maxTransactions ?? -1),
                maxTeamMembers:        Number(body.maxTeamMembers  ?? 0),
                maxFarms:              Number(body.maxFarms        ?? 1),
                seasonAnalytics:       Boolean(body.seasonAnalytics),
                yieldSuggestions:      Boolean(body.yieldSuggestions),
                costPerHectare:        Boolean(body.costPerHectare),
                payrollTracking:       Boolean(body.payrollTracking),
                multipleFarms:         Boolean(body.multipleFarms),
                teamAccounts:          Boolean(body.teamAccounts),
                customReports:         Boolean(body.customReports),
                apiAccess:             Boolean(body.apiAccess),
                dataRetentionLifetime: Boolean(body.dataRetentionLifetime),
                isActive:              Boolean(body.isActive  ?? true),
                isPublic:              Boolean(body.isPublic  ?? true),
                isFeatured:            Boolean(body.isFeatured ?? false),
                sortOrder:             Number(body.sortOrder   ?? 0),
            },
        });
        return NextResponse.json(tier);
    } catch (err: any) {
        console.error("Tier PATCH error:", err.message);
        return NextResponse.json({ error: err.message ?? "Update failed" }, { status: 500 });
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await prisma.subscriptionTier.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Tier DELETE error:", err.message);
        return NextResponse.json({ error: err.message ?? "Delete failed" }, { status: 500 });
    }
}