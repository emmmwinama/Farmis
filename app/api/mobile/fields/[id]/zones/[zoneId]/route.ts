import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string; zoneId: string } | Promise<{ id: string; zoneId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const { id: fieldId, zoneId } = await params;

  const existing = await prisma.fieldZone.findFirst({ where: { id: zoneId, fieldId, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  const body = await req.json();
  const zone = await prisma.fieldZone.update({
    where: { id: zoneId },
    data: {
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      cropFieldId: body.cropFieldId === undefined ? existing.cropFieldId : body.cropFieldId || null,
      geoJson: body.geoJson ?? existing.geoJson,
      areaHa: body.areaHa === undefined ? existing.areaHa : parseFloat(body.areaHa),
      colour: body.colour === undefined ? existing.colour : body.colour || null,
      notes: body.notes === undefined ? existing.notes : body.notes || null,
    },
    include: { cropField: { include: { cropType: true } } },
  });

  return NextResponse.json(zone);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const { id: fieldId, zoneId } = await params;

  const existing = await prisma.fieldZone.findFirst({ where: { id: zoneId, fieldId, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  await prisma.fieldZone.delete({ where: { id: zoneId } });
  return NextResponse.json({ success: true });
}
