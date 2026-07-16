import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
    const ip = getClientIp(req);
    if (isRateLimited(`demo:${ip}`, 5, 60 * 1000)) {
        return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, farm, message } = body;
    const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
    const cleanFarm = typeof farm === "string" ? farm.trim().slice(0, 160) : "";
    const cleanMessage = typeof message === "string" ? message.trim().slice(0, 5000) : "";

    if (!cleanName || !cleanEmail || !cleanFarm) {
        return NextResponse.json({ error: "Name, email and farm are required" }, { status: 400 });
    }

    await prisma.demoBooking.create({
        data: { name: cleanName, email: cleanEmail, farm: cleanFarm, message: cleanMessage },
    });

    return NextResponse.json({ success: true });
}
