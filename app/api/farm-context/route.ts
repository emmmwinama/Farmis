import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllAccessibleFarms, getActiveFarmId } from "@/lib/farmContext";
import { cookies } from "next/headers";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const farms = await getAllAccessibleFarms(user.id);
    const activeFarmId = await getActiveFarmId(user.id);

    return NextResponse.json({ farms, activeFarmId });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { farmId } = await req.json();

    // Verify access
    const ownsFarm = await prisma.farm.findFirst({ where: { id: farmId, userId: user.id } });
    const isMember = await prisma.teamMember.findFirst({ where: { farmId, userId: user.id, status: "active" } });

    if (!ownsFarm && !isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const cookieStore = cookies();
    cookieStore.set(`active_farm_${user.id}`, farmId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
    });

    return NextResponse.json({ success: true, farmId });
}