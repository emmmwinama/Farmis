import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "equipment");
  if (access.error) return access.error;

  const [equipment, costs] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { farmId: access.session.farmId!, category: "equipment" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.overheadExpense.findMany({
      where: { farmId: access.session.farmId!, category: { in: ["Fuel", "Maintenance", "Machinery"] } },
      orderBy: { date: "desc" },
    }),
  ]);

  return NextResponse.json({ equipment, costs });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "equipment");
  if (access.error) return access.error;

  const body = await req.json();

  if (body.kind === "cost") {
    const cost = await prisma.overheadExpense.create({
      data: {
        farmId: access.session.farmId!,
        description: body.description,
        category: body.category || "Machinery",
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes ?? "",
        recurring: false,
      },
    });
    return NextResponse.json(cost, { status: 201 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      farmId: access.session.farmId!,
      name: body.name,
      category: "equipment",
      unit: body.unit || "unit",
      quantity: body.quantity ? parseFloat(body.quantity) : 1,
      notes: body.notes ?? "",
    },
  });

  return NextResponse.json(item, { status: 201 });
}
