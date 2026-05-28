import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const animalId = searchParams.get("animalId");
    const upcoming = searchParams.get("upcoming") === "true";

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);

    const records = await prisma.animalHealth.findMany({
        where: {
            farmId: farm.id,
            ...(animalId ? { animalId } : {}),
            ...(upcoming ? { nextDueDate: { gte: now, lte: soon } } : {}),
        },
        include: {
            animal: { include: { livestockType: true } },
        },
        orderBy: { date: "desc" },
    });

    const totalCost = records.reduce((s, r) => s + r.cost, 0);
    const upcomingCount = records.filter((r) => r.nextDueDate && r.nextDueDate >= now && r.nextDueDate <= soon).length;

    return NextResponse.json({ records, totalCost, upcomingCount });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { animalId, type, description, veterinarian, cost, date, nextDueDate, notes } = body;

    if (!animalId || !type || !description || !date) {
        return NextResponse.json({ error: "Animal, type, description and date are required" }, { status: 400 });
    }

    const record = await prisma.animalHealth.create({
        data: {
            animalId,
            farmId:       farm.id,
            type,
            description,
            veterinarian: veterinarian || null,
            cost:         parseFloat(cost) || 0,
            date:         new Date(date),
            nextDueDate:  nextDueDate ? new Date(nextDueDate) : null,
            notes:        notes || null,
        },
    });

    // Create expense if cost > 0
    if (parseFloat(cost) > 0) {
        await prisma.animalExpense.create({
            data: {
                farmId:      farm.id,
                animalId,
                category:    "Veterinary",
                description: `${type}: ${description}`,
                amount:      parseFloat(cost),
                date:        new Date(date),
            },
        });
    }

    return NextResponse.json(record, { status: 201 });
}