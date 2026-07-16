import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getTrialEndDate } from "@/lib/tiers";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        const data: any = {};
        if (body.tierId       !== undefined) data.tierId       = body.tierId;
        if (body.status       !== undefined) data.status       = body.status;
        if (body.billingCycle !== undefined) data.billingCycle = body.billingCycle;
        if (body.notes        !== undefined) data.notes        = body.notes;

        // Handle endDate — null clears it, a date string sets it
        if ("endDate" in body) {
            data.endDate = body.endDate ? new Date(body.endDate) : null;
        }

        if (body.status === "trial") {
            const trialEndsAt = data.endDate ?? getTrialEndDate();
            data.trialEndsAt = trialEndsAt;
            data.endDate = trialEndsAt;
        } else if (body.status && body.status !== "trial") {
            data.trialEndsAt = null;
        }

        const sub = await prisma.subscription.update({
            where: { id: params.id },
            data,
        });

        return NextResponse.json(sub);
    } catch (err: any) {
        console.error("Admin subscriptions PATCH error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.subscription.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Admin subscriptions DELETE error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}
