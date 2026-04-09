import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Strip out fields that don't belong in the update
    const {
        id,
        createdAt,
        _count,
        subscriptions,
        ...updateData
    } = body;

    const tier = await prisma.subscriptionTier.update({
        where: { id: params.id },
        data: {
            ...updateData,
            priceMonthly: parseFloat(updateData.priceMonthly) || 0,
            priceAnnual: updateData.priceAnnual ? parseFloat(updateData.priceAnnual) : null,
            maxFields: parseInt(updateData.maxFields),
            maxCrops: parseInt(updateData.maxCrops),
            maxActivities: parseInt(updateData.maxActivities),
            maxTransactions: parseInt(updateData.maxTransactions),
            maxEmployees: parseInt(updateData.maxEmployees),
            maxFarms: parseInt(updateData.maxFarms),
            maxTeamMembers: parseInt(updateData.maxTeamMembers),
        },
    });

    return NextResponse.json(tier);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const count = await prisma.subscription.count({ where: { tierId: params.id } });
    if (count > 0) {
        return NextResponse.json(
            { error: "Cannot delete a tier with active subscriptions" },
            { status: 400 }
        );
    }

    await prisma.subscriptionTier.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}