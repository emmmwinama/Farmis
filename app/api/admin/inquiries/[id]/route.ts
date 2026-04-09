import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, ...data } = body;

    if (type === "contact") {
        const updated = await prisma.contactSubmission.update({
            where: { id: params.id },
            data: {
                status: data.status,
                notes: data.notes,
                repliedAt: data.status === "replied" ? new Date() : undefined,
            },
        });
        return NextResponse.json(updated);
    } else {
        const updated = await prisma.demoBooking.update({
            where: { id: params.id },
            data: {
                status: data.status,
                notes: data.notes,
                bookedFor: data.bookedFor ? new Date(data.bookedFor) : undefined,
            },
        });
        return NextResponse.json(updated);
    }
}