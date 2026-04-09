import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [contacts, bookings] = await Promise.all([
        prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.demoBooking.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({ contacts, bookings });
}