import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const member = await prisma.teamMember.findUnique({ where: { inviteToken: token } });
    if (!member) return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });

    await prisma.teamMember.update({
        where: { id: member.id },
        data: { status: "active", inviteToken: null },
    });

    return NextResponse.json({ success: true, farmId: member.farmId });
}