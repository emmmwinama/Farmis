import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;
  const { id } = await params;

  const animal = await prisma.animal.findFirst({
    where: { id, farmId: access.session.farmId! },
    include: {
      livestockType: true,
      healthRecords: { orderBy: { date: "desc" } },
      productions: { orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      sales: { orderBy: { saleDate: "desc" } },
      weightRecords: { orderBy: { date: "desc" } },
      parent: true,
      offsprings: true,
    },
  });

  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  return NextResponse.json(animal);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.animal.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const body = await req.json();
  const animal = await prisma.animal.update({
    where: { id },
    data: {
      livestockTypeId: body.livestockTypeId ?? existing.livestockTypeId,
      tag: body.tag === undefined ? existing.tag : body.tag || null,
      name: body.name === undefined ? existing.name : body.name || null,
      group: body.group === undefined ? existing.group : body.group || null,
      sex: body.sex ?? existing.sex,
      birthDate: body.birthDate === undefined ? existing.birthDate : body.birthDate ? new Date(body.birthDate) : null,
      acquisitionDate: body.acquisitionDate === undefined ? existing.acquisitionDate : body.acquisitionDate ? new Date(body.acquisitionDate) : existing.acquisitionDate,
      acquisitionType: body.acquisitionType ?? existing.acquisitionType,
      acquisitionCost: body.acquisitionCost === undefined ? existing.acquisitionCost : body.acquisitionCost ? parseFloat(body.acquisitionCost) : null,
      status: body.status ?? existing.status,
      breed: body.breed === undefined ? existing.breed : body.breed || null,
      colour: body.colour === undefined ? existing.colour : body.colour || null,
      weight: body.weight === undefined ? existing.weight : body.weight ? parseFloat(body.weight) : null,
      notes: body.notes === undefined ? existing.notes : body.notes ?? "",
      parentId: body.parentId === undefined ? existing.parentId : body.parentId || null,
    },
  });

  return NextResponse.json(animal);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.animal.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  await prisma.animal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
