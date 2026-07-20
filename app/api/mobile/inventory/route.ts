import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

function quantityKg(item: { unit: string; quantity: number; unitWeight: number | null }) {
  const unit = item.unit.toLowerCase();
  if (unit === "kg") return item.quantity;
  if (unit === "tonnes" || unit === "tonne") return item.quantity * 1000;
  return item.unitWeight ? item.quantity * item.unitWeight : item.quantity;
}

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const items = await prisma.inventoryItem.findMany({
    where: {
      farmId: access.session.farmId!,
      ...(category ? { category } : {}),
    },
    include: {
      cropField: { include: { cropType: true, field: true } },
      sales: { orderBy: { saleDate: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      acquisitionUnitCost: item.acquisitionUnitCost,
      acquiredAt: item.acquiredAt,
      unitWeight: item.unitWeight,
      season: item.season,
      cropFieldId: item.cropFieldId,
      cropName: item.cropField?.cropType.name ?? null,
      fieldName: item.cropField?.field.name ?? null,
      notes: item.notes,
      quantityKg: quantityKg(item),
      lowStock: item.quantity <= 5,
      totalRevenue: item.sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      sales: item.sales,
    })),
  });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;

  const body = await req.json();
  const { name, category, unit, quantity, unitWeight, acquisitionUnitCost, acquiredAt, season, cropFieldId, notes } = body;

  if (!name || !category || !unit || quantity === undefined) {
    return NextResponse.json({ error: "Name, category, unit and quantity are required" }, { status: 400 });
  }

  const existing = await prisma.inventoryItem.findFirst({
    where: {
      farmId: access.session.farmId!,
      name: String(name).trim(),
      category,
      unit,
      season: season || null,
      cropFieldId: cropFieldId || null,
    },
  });

  if (existing) {
    const item = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + parseFloat(quantity),
        acquisitionUnitCost: acquisitionUnitCost ? parseFloat(acquisitionUnitCost) : existing.acquisitionUnitCost,
        acquiredAt: acquiredAt ? new Date(acquiredAt) : existing.acquiredAt,
        unitWeight: unitWeight ? parseFloat(unitWeight) : existing.unitWeight,
        notes: notes ? `${existing.notes ?? ""}\nPurchase/addition: ${notes}`.trim() : existing.notes,
      },
    });
    return NextResponse.json(item);
  }

  const item = await prisma.inventoryItem.create({
    data: {
      farmId: access.session.farmId!,
      name: String(name).trim(),
      category,
      unit,
      quantity: parseFloat(quantity),
      acquisitionUnitCost: acquisitionUnitCost ? parseFloat(acquisitionUnitCost) : null,
      acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
      unitWeight: unitWeight ? parseFloat(unitWeight) : null,
      season: season || null,
      cropFieldId: cropFieldId || null,
      notes: notes ?? "",
    },
  });

  return NextResponse.json(item, { status: 201 });
}
