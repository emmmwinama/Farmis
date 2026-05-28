import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const type = await prisma.livestockType.update({
        where: { id: params.id },
        data: body,
    });
    return NextResponse.json(type);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const count = await prisma.animal.count({ where: { livestockTypeId: params.id } });
    if (count > 0) {
        return NextResponse.json({ error: "Cannot delete a type with animals assigned" }, { status: 400 });
    }

    await prisma.livestockType.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}