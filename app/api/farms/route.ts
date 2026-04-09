import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit } from "@/lib/subscription";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const farms = await prisma.farm.findMany({
        where: { userId: user.id },
        include: {
            _count: { select: { fields: true, employees: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(farms);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
        await checkLimit(user.id, "Farms");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const { name, location } = await req.json();
    if (!name) return NextResponse.json({ error: "Farm name is required" }, { status: 400 });

    const farm = await prisma.farm.create({
        data: { userId: user.id, name, location: location ?? "Not set" },
    });

    return NextResponse.json(farm, { status: 201 });
}