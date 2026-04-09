import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const page = await prisma.cmsPage.update({ where: { slug: params.slug }, data: body });
    return NextResponse.json(page);
}