import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            farms: {
                include: {
                    _count: { select: { fields: true, employees: true } },
                },
            },
            subscription: { include: { tier: true } },
        },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { farm } = await getSessionFarm();

    return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
        farm: farm ?? null,
        farms: user.farms.map((f) => ({
            id: f.id,
            name: f.name,
            location: f.location,
            fieldCount: f._count.fields,
            employeeCount: f._count.employees,
        })),
        subscription: user.subscription
            ? {
                tierName: user.subscription.tier.name,
                status: user.subscription.status,
                endDate: user.subscription.endDate,
                maxFarms: user.subscription.tier.maxFarms,
            }
            : null,
    });
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userName, farmName, farmLocation, farmId } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (userName) {
        await prisma.user.update({ where: { id: user.id }, data: { name: userName } });
    }

    if (farmName || farmLocation) {
        const targetFarmId = farmId ?? (await getSessionFarm()).farm?.id;
        if (targetFarmId) {
            await prisma.farm.update({
                where: { id: targetFarmId },
                data: {
                    ...(farmName ? { name: farmName } : {}),
                    ...(farmLocation ? { location: farmLocation } : {}),
                },
            });
        }
    }

    return NextResponse.json({ success: true });
}