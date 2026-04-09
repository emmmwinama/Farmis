import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const feature = await prisma.cmsFeature.update({ where: { id: params.id }, data: body });
    return NextResponse.json(feature);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.cmsFeature.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}