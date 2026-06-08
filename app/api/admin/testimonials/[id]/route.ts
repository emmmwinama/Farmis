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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updated = await prisma.testimonial.update({
        where: { id: params.id },
        data: body,
    });
    return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({error: "Unauthorized"}, {status: 401});

    await prisma.testimonial.delete({where: {id: params.id}});
    return NextResponse.json({success: true});
}