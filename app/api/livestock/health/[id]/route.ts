import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const record = await prisma.animalHealth.update({
        where: { id: params.id },
        data: {
            type:         body.type,
            description:  body.description,
            veterinarian: body.veterinarian || null,
            cost:         parseFloat(body.cost) || 0,
            date:         new Date(body.date),
            nextDueDate:  body.nextDueDate ? new Date(body.nextDueDate) : null,
            notes:        body.notes || null,
        },
    });
    return NextResponse.json(record);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.animalHealth.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}