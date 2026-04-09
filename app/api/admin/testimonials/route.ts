import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(testimonials);
}

export async function POST(req: Request) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const t = await prisma.testimonial.create({ data: body });
    return NextResponse.json(t, { status: 201 });
}