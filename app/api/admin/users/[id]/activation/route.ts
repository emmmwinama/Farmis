import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(_: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
        where: { id: params.id },
        data: { activationToken: token },
    });

    const activationLink = `${process.env.NEXTAUTH_URL}/activate?token=${token}`;
    return NextResponse.json({ activationLink });
}