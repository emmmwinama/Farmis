import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const access = await requireFarmPermission("livestock", "write");
    if (access.error) return access.error;

    const body = await req.json();
    const existing = await prisma.animalHealth.findFirst({
        where: { id: params.id, animal: { farmId: access.farm.id } },
    });
    if (!existing) return NextResponse.json({ error: "Health record not found" }, { status: 404 });

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
    const access = await requireFarmPermission("livestock", "write");
    if (access.error) return access.error;

    const existing = await prisma.animalHealth.findFirst({
        where: { id: params.id, animal: { farmId: access.farm.id } },
    });
    if (!existing) return NextResponse.json({ error: "Health record not found" }, { status: 404 });

    await prisma.animalHealth.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
