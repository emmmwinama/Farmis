import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await prisma.contactSubmission.create({
        data: { name, email, message },
    });

    return NextResponse.json({ success: true });
}