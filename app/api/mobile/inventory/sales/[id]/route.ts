import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.inventorySale.findFirst({
    where: { id, inventoryItem: { farmId: access.session.farmId! } },
    include: { inventoryItem: true },
  });
  if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const body = await req.json();
  const quantitySold = body.quantitySold === undefined ? existing.quantitySold : parseFloat(body.quantitySold);
  const pricePerUnit = body.pricePerUnit === undefined ? existing.pricePerUnit : parseFloat(body.pricePerUnit);
  const totalAmount = quantitySold * pricePerUnit;
  const quantityDelta = quantitySold - existing.quantitySold;

  if (quantityDelta > existing.inventoryItem.quantity) {
    return NextResponse.json({ error: `Only ${existing.inventoryItem.quantity} ${existing.inventoryItem.unit} available` }, { status: 400 });
  }

  const sale = await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.update({
      where: { id: existing.inventoryItemId },
      data: { quantity: existing.inventoryItem.quantity - quantityDelta },
    });
    const updated = await tx.inventorySale.update({
      where: { id },
      data: {
        quantitySold,
        unit: body.unit ?? existing.unit,
        pricePerUnit,
        totalAmount,
        buyerName: body.buyerName === undefined ? existing.buyerName : body.buyerName || null,
        saleDate: body.saleDate === undefined ? existing.saleDate : new Date(body.saleDate),
        notes: body.notes === undefined ? existing.notes : body.notes ?? "",
      },
    });
    if (existing.transactionId) {
      await tx.transaction.update({
        where: { id: existing.transactionId },
        data: { amount: totalAmount, date: body.saleDate === undefined ? existing.saleDate : new Date(body.saleDate) },
      });
    }
    return updated;
  });

  return NextResponse.json(sale);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.inventorySale.findFirst({
    where: { id, inventoryItem: { farmId: access.session.farmId! } },
    include: { inventoryItem: true },
  });
  if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.update({
      where: { id: existing.inventoryItemId },
      data: { quantity: existing.inventoryItem.quantity + existing.quantitySold },
    });
    await tx.inventorySale.delete({ where: { id } });
    if (existing.transactionId) await tx.transaction.delete({ where: { id: existing.transactionId } });
  });

  return NextResponse.json({ success: true });
}
