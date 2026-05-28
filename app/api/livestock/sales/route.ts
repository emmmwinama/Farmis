import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sales = await prisma.animalSale.findMany({
        where: { farmId: farm.id },
        include: { animal: { include: { livestockType: true } } },
        orderBy: { saleDate: "desc" },
    });

    return NextResponse.json({
        sales,
        total: sales.reduce((s, sale) => s + sale.totalAmount, 0),
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { animalId, saleDate, quantity, weightAtSale, pricePerKg, totalAmount, buyer, notes } = body;

    if (!animalId || !saleDate || !totalAmount) {
        return NextResponse.json({ error: "Animal, date and amount are required" }, { status: 400 });
    }

    const sale = await prisma.animalSale.create({
        data: {
            farmId:      farm.id,
            animalId,
            saleDate:    new Date(saleDate),
            quantity:    parseInt(quantity) || 1,
            weightAtSale: weightAtSale ? parseFloat(weightAtSale) : null,
            pricePerKg:  pricePerKg ? parseFloat(pricePerKg) : null,
            totalAmount: parseFloat(totalAmount),
            buyer:       buyer || null,
            notes:       notes || null,
        },
    });

    // Mark animal as sold
    await prisma.animal.update({
        where: { id: animalId },
        data:  { status: "Sold" },
    });

    // Auto-create finance income record
    const animal = await prisma.animal.findUnique({
        where: { id: animalId },
        include: { livestockType: true },
    });

    await prisma.transaction.create({
        data: {
            farmId:      farm.id,
            type:        "Income",
            category:    "Livestock sales",
            amount:      parseFloat(totalAmount),
            date:        new Date(saleDate),
            description: `Sale of ${animal?.livestockType?.name ?? "animal"}${buyer ? ` to ${buyer}` : ""}`,
        },
    });

    return NextResponse.json(sale, { status: 201 });
}