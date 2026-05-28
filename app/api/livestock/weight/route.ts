import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { animalId, weight, date, notes } = body;

    if (!animalId || !weight || !date) {
        return NextResponse.json({ error: "Animal, weight and date are required" }, { status: 400 });
    }

    const record = await prisma.animalWeight.create({
        data: {
            animalId,
            weight: parseFloat(weight),
            date:   new Date(date),
            notes:  notes || null,
        },
    });

    return NextResponse.json(record, { status: 201 });
}