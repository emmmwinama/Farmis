import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;

  const body = await req.json();
  const { recordType, animalId } = body;

  const animal = animalId
    ? await prisma.animal.findFirst({ where: { id: animalId, farmId: access.session.farmId! }, include: { livestockType: true } })
    : null;

  if (animalId && !animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  if (recordType === "health") {
    const record = await prisma.animalHealth.create({
      data: {
        animalId,
        farmId: access.session.farmId!,
        type: body.type,
        description: body.description,
        veterinarian: body.veterinarian || null,
        cost: body.cost ? parseFloat(body.cost) : 0,
        date: new Date(body.date),
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        notes: body.notes ?? "",
      },
    });
    return NextResponse.json(record, { status: 201 });
  }

  if (recordType === "production") {
    const record = await prisma.animalProduction.create({
      data: {
        animalId: animalId || null,
        farmId: access.session.farmId!,
        type: body.type,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        date: new Date(body.date),
        pricePerUnit: body.pricePerUnit ? parseFloat(body.pricePerUnit) : null,
        totalValue: body.totalValue ? parseFloat(body.totalValue) : null,
        notes: body.notes ?? "",
      },
    });
    return NextResponse.json(record, { status: 201 });
  }

  if (recordType === "expense") {
    const record = await prisma.animalExpense.create({
      data: {
        animalId: animalId || null,
        farmId: access.session.farmId!,
        category: body.category,
        description: body.description,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes ?? "",
      },
    });
    return NextResponse.json(record, { status: 201 });
  }

  if (recordType === "weight") {
    if (!animalId) return NextResponse.json({ error: "Animal is required" }, { status: 400 });
    const record = await prisma.animalWeight.create({
      data: {
        animalId,
        weight: parseFloat(body.weight),
        unit: body.unit || "kg",
        date: new Date(body.date),
        notes: body.notes ?? "",
      },
    });
    return NextResponse.json(record, { status: 201 });
  }

  if (recordType === "sale") {
    if (!animalId || !animal) return NextResponse.json({ error: "Animal is required" }, { status: 400 });
    const totalAmount = parseFloat(body.totalAmount);
    const sale = await prisma.animalSale.create({
      data: {
        animalId,
        farmId: access.session.farmId!,
        saleDate: new Date(body.saleDate),
        quantity: body.quantity ? parseInt(body.quantity, 10) : 1,
        weightAtSale: body.weightAtSale ? parseFloat(body.weightAtSale) : null,
        pricePerKg: body.pricePerKg ? parseFloat(body.pricePerKg) : null,
        totalAmount,
        buyer: body.buyer || null,
        notes: body.notes ?? "",
      },
    });

    await prisma.transaction.create({
      data: {
        farmId: access.session.farmId!,
        type: "Income",
        category: "Livestock sales",
        amount: totalAmount,
        date: new Date(body.saleDate),
        description: `Sale of ${animal.livestockType.name}${body.buyer ? ` to ${body.buyer}` : ""}`,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported livestock record type" }, { status: 400 });
}
