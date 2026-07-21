import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("activities", "write");
    if (access.error) return access.error;

    const existing = await prisma.farmActivity.findFirst({
        where: { id: params.id, field: { farmId: access.farm.id } },
    });
    if (!existing) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    await prisma.farmActivity.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
