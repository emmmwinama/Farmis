import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;

  const [types, animals] = await Promise.all([
    prisma.livestockType.findMany({ where: { farmId: access.session.farmId! }, orderBy: { name: "asc" } }),
    prisma.animal.findMany({
      where: { farmId: access.session.farmId! },
      include: {
        livestockType: true,
        healthRecords: { orderBy: { date: "desc" }, take: 5 },
        productions: { orderBy: { date: "desc" }, take: 5 },
        expenses: { orderBy: { date: "desc" }, take: 5 },
        sales: { orderBy: { saleDate: "desc" }, take: 5 },
        weightRecords: { orderBy: { date: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ types, animals });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "livestock");
  if (access.error) return access.error;

  const body = await req.json();
  const { livestockTypeId, tag, name, group, sex, birthDate, acquisitionDate, acquisitionType, acquisitionCost, breed, colour, weight, notes } = body;

  if (!livestockTypeId) {
    return NextResponse.json({ error: "Livestock type is required" }, { status: 400 });
  }

  const type = await prisma.livestockType.findFirst({
    where: { id: livestockTypeId, farmId: access.session.farmId! },
  });
  if (!type) return NextResponse.json({ error: "Livestock type not found" }, { status: 404 });

  const animal = await prisma.animal.create({
    data: {
      farmId: access.session.farmId!,
      livestockTypeId,
      tag: tag || null,
      name: name || null,
      group: group || null,
      sex: sex || "Unknown",
      birthDate: birthDate ? new Date(birthDate) : null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
      acquisitionType: acquisitionType || "Born on farm",
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
      breed: breed || null,
      colour: colour || null,
      weight: weight ? parseFloat(weight) : null,
      notes: notes ?? "",
    },
  });

  return NextResponse.json(animal, { status: 201 });
}
