import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getMobileSession(req);
    if (!session?.farmId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const y = await prisma.harvestYield.findFirst({
        where: {
            id:        params.id,
            cropField: { field: { farmId: session.farmId } },
        },
    });
    if (!y)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.harvestYield.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}