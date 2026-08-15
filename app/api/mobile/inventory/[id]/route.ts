import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;
  const { id } = await params;

  const item = await prisma.inventoryItem.findFirst({
    where: { id, farmId: access.session.farmId! },
    include: {
      cropField: { include: { cropType: true, field: true } },
      harvestYield: true,
      sales: { include: { transaction: true }, orderBy: { saleDate: "desc" } },
      activityInputs: { include: { activity: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.inventoryItem.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  const body = await req.json();
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      category: body.category ?? existing.category,
      unit: body.unit ?? existing.unit,
      quantity: body.quantity === undefined ? existing.quantity : parseFloat(body.quantity),
      acquisitionUnitCost: body.acquisitionUnitCost === undefined ? existing.acquisitionUnitCost : body.acquisitionUnitCost ? parseFloat(body.acquisitionUnitCost) : null,
      acquiredAt: body.acquiredAt === undefined ? existing.acquiredAt : body.acquiredAt ? new Date(body.acquiredAt) : null,
      unitWeight: body.unitWeight === undefined ? existing.unitWeight : body.unitWeight ? parseFloat(body.unitWeight) : null,
      season: body.season === undefined ? existing.season : body.season || null,
      cropFieldId: body.cropFieldId === undefined ? existing.cropFieldId : body.cropFieldId || null,
      notes: body.notes === undefined ? existing.notes : body.notes ?? "",
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "finance");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.inventoryItem.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
