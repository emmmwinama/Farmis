import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.json();
    const { name, email, farm, message } = body;

    if (!name || !email || !farm) {
        return NextResponse.json({ error: "Name, email and farm are required" }, { status: 400 });
    }

    await prisma.demoBooking.create({
        data: { name, email, farm, message: message ?? "" },
    });

    return NextResponse.json({ success: true });
}