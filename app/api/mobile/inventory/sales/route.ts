import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const inventoryItemId = searchParams.get("inventoryItemId");

  const sales = await prisma.inventorySale.findMany({
    where: {
      inventoryItem: { farmId: access.session.farmId! },
      ...(inventoryItemId ? { inventoryItemId } : {}),
    },
    include: { inventoryItem: true, transaction: true },
    orderBy: { saleDate: "desc" },
  });

  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;

  const body = await req.json();
  const { inventoryItemId, quantitySold, unit, pricePerUnit, buyerName, saleDate, notes, createFinanceRecord = true } = body;

  if (!inventoryItemId || !quantitySold || !pricePerUnit || !saleDate) {
    return NextResponse.json({ error: "Inventory item, quantity, price and sale date are required" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, farmId: access.session.farmId! },
  });
  if (!item) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  const sold = parseFloat(quantitySold);
  if (sold > item.quantity) {
    return NextResponse.json({ error: `Only ${item.quantity} ${item.unit} available` }, { status: 400 });
  }

  const totalAmount = sold * parseFloat(pricePerUnit);
  let transactionId: string | null = null;

  if (createFinanceRecord) {
    const tx = await prisma.transaction.create({
      data: {
        farmId: access.session.farmId!,
        type: "Income",
        category: "Crop sales",
        amount: totalAmount,
        date: new Date(saleDate),
        description: `Sale of ${item.name}${buyerName ? ` to ${buyerName}` : ""}`,
        season: item.season,
        cropFieldId: item.cropFieldId,
        inventoryItemId: item.id,
      },
    });
    transactionId = tx.id;
  }

  const sale = await prisma.inventorySale.create({
    data: {
      inventoryItemId: item.id,
      transactionId,
      quantitySold: sold,
      unit: unit || item.unit,
      pricePerUnit: parseFloat(pricePerUnit),
      totalAmount,
      buyerName: buyerName || null,
      saleDate: new Date(saleDate),
      notes: notes ?? "",
    },
  });

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { quantity: item.quantity - sold },
  });

  return NextResponse.json(sale, { status: 201 });
}
