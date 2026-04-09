import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, totalArea, cultivatableArea, soilType, locationLat, locationLng, notes } = body;

    if (parseFloat(cultivatableArea) > parseFloat(totalArea)) {
        return NextResponse.json(
            { error: "Cultivatable area cannot exceed total area" },
            { status: 400 }
        );
    }

    const field = await prisma.field.update({
        where: { id: params.id },
        data: {
            name,
            totalArea: parseFloat(totalArea),
            cultivatableArea: parseFloat(cultivatableArea),
            soilType,
            locationLat: locationLat ? parseFloat(locationLat) : null,
            locationLng: locationLng ? parseFloat(locationLng) : null,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(field);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.field.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}