import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string; zoneId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const zone = await prisma.fieldZone.update({
        where: { id: params.zoneId },
        data: {
            name:        body.name,
            type:        body.type,
            cropFieldId: body.cropFieldId || null,
            colour:      body.colour || null,
            notes:       body.notes || null,
        },
        include: { cropField: { include: { cropType: true } } },
    });

    return NextResponse.json(zone);
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string; zoneId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.fieldZone.delete({ where: { id: params.zoneId } });
    return NextResponse.json({ success: true });
}