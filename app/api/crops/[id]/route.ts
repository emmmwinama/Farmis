import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { variety, areaPlanted, season, plantingDate, expectedHarvestDate, status } = body;

    const crop = await prisma.cropField.update({
        where: { id: params.id },
        data: {
            variety,
            areaPlanted: parseFloat(areaPlanted),
            season,
            plantingDate: new Date(plantingDate),
            expectedHarvestDate: new Date(expectedHarvestDate),
            status,
        },
    });

    return NextResponse.json(crop);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.cropField.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}