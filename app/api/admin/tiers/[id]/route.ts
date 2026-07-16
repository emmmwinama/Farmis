import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { normalizeTierInput } from "@/lib/tiers";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    try {
        const data = normalizeTierInput(body);
        if (!data.name) return NextResponse.json({ error: "Tier name is required" }, { status: 400 });

        const tier = await prisma.subscriptionTier.update({
            where: { id: params.id },
            data,
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
        const subscriptionCount = await prisma.subscription.count({ where: { tierId: params.id } });
        if (subscriptionCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete a tier that has subscriptions. Hide it instead." },
                { status: 409 }
            );
        }

        await prisma.subscriptionTier.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Tier DELETE error:", err.message);
        return NextResponse.json({ error: err.message ?? "Delete failed" }, { status: 500 });
    }
}
