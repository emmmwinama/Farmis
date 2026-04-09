import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { farms: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        farm: user.farms[0] ?? null,
    });
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userName, farmName, farmLocation } = body;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { farms: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.update({
        where: { id: user.id },
        data: { name: userName },
    });

    if (user.farms[0]) {
        await prisma.farm.update({
            where: { id: user.farms[0].id },
            data: { name: farmName, location: farmLocation },
        });
    }

    return NextResponse.json({ success: true });
}